<template>
  <div class="mgv-app">
    <m-header @gear-clicked="toggleDrawer"></m-header>
    <div name="content" class="flexrow">
      <!--
      ============ Left column ==============================================
      -->
      <page-box-container
        name="leftColumn"
        ref="toolDrawer"
        class="flexcolumn"
        :class="{ open: drawerOpen, closed: !drawerOpen}"
        :style="{ height: visHeight + 'px', overflow: 'scroll' }"
        >
        <!--
        ============ Find Genes ==============
        -->
        <page-box
          label="FindGenes"
          icon="search"
          >
          <find-genes
            ref="findGenes"
            title="Creates a new list of genes having the specified annotations. Select criterion (eg by pathway), enter a term (eg apoptosis), and hit enter. Results appear in MyLists"
            />
        </page-box>
        <!--
        ============ My Lists ==============
        -->
        <page-box
          label="MyLists"
          icon="list"
          >
          <my-lists
            title="Shows your current lists. A list simply contains identifiers. Click on a list to show its items in the genome view; click again to hide them. Click on the 'x' to delete a list. Click on the pencil to edit the list (see ListEditor)."
            :lists="lists"
            :currentList="currentList"
            />
        </page-box>
        <!--
        ============ Facets (aka Filters) ==============
        -->
        <page-box
          :message="activeFacets ? 'There are active filters. Some features may not be visible.' : ''"
          label="Filters"
          icon="filter_list"
          >
          <facets
            title="Limit what feature are displayed by different criteria."
            ref="facets"
            />
        </page-box>
        <!--
        ============ Settings ==============
        -->
        <page-box
          label="Settings"
          icon="settings"
          >
          <settings
            title="Provides options for customizing the display. Settings are remembered between sessions."
            ref="settings"
            />
        </page-box>
        <!--
        ============ Sequence Cart ==============
        -->
        <page-box
          label="SequenceCart"
          icon="shopping_cart"
          >
          <sequence-cart
            title="Your basket of selected sequences."
            ref="sequenceCart"
            />
        </page-box>
      </page-box-container>
      <!--
      ============ Right column ==============================================
      -->
      <page-box-container
        name="rightColumn"
        :style="{ height: visHeight + 'px', overflow: 'scroll' }"
        class="flexcolumn">
        <!--
        ============ Genome View ==============
        -->
        <page-box
          label="GenomeView"
          icon="language"
          >
          <genome-view
            :context="$data"
            ref="genomeView"
            title="Shows a whole genome view. Colored tabs indicate any regions currently displayed in the ZoomView. Lollipop glyphs indicate current list items (if any). Drag tab to change the viewed region. Click or drag on a chromosome to open a new region."
            />
        </page-box>
        <!--
        ============ Feature Details ==========
        -->
        <page-box
          label="FeatureDetails"
          icon="description"
          >
          <feature-details
            ref="featureDetails"
            title="Shows details of a feature you click on. When open, shows details for genologs in all currently displayed genomes. When closed, shows only the feature in the genome that was clicked."
            :features="detailFeatures"
            :currentMouseover="currentMouseover"
            />
        </page-box>
        <!--
        ============== Zoom View ==============
        -->
        <page-box
          :message="activeFacets ? 'There are active filters. Some features may not be visible.' : ''"
          label="ZoomView"
          icon="view_agenda"
          >
          <zoom-view
            :context="$data"
            ref="zoomView"
            title="The main view. Shows features in selected regions of selected genomes. You can zoom, scroll, find genes, download sequences and more. These operations can affect regions independently or in synch using the lock icon. Most things can be undone using the browser's Back button."
            />
        </page-box>
      </page-box-container>
      <!--
      ============ Floating ==============================================
      -->
      <!--
      ============ List Editor ==============
      -->
      <page-box
        label="ListEditor"
        :floating="true"
        :initialX="250"
        :initialY="100"
        :initiallyOpen="false"
        iconClose="close"
        ><list-editor
          title="Examine/modify the contents of a list. Create a new list. Combine lists with intersection, union, and difference."
          :list="currentEditList"
          ref="listEditor"
          />
      </page-box>
    </div>
    <m-footer version="1.0.0"></m-footer>
  </div>
</template>

<script>
import MHeader from '@/components/MHeader'
import MFooter from '@/components/MFooter'
import PageBox from '@/components/PageBox'
import PageBoxContainer from '@/components/PageBoxContainer'
import GenomeSelector from '@/components/GenomeSelector'
import Settings from '@/components/Settings'
import MyLists from '@/components/MyLists'
import SequenceCart from '@/components/SequenceCart'
import FindGenes from '@/components/FindGenes'
import ListEditor from '@/components/ListEditor'
import Facets from '@/components/Facets'
import GenomeView from '@/components/GenomeView'
import ZoomView from '@/components/ZoomView'
import FeatureDetails from '@/components/FeatureDetails'
import FeatureColorMap from '@/lib/FeatureColorMap'
import MComponent from '@/components/MComponent'
import gc from '@/lib/GenomeCoordinates'
import u from '@/lib/utils'
import config from '@/config'
import KeyStore from '@/lib/KeyStore'
import HistoryManager from '@/lib/HistoryManager'
import RegionManager from '@/lib/RegionManager'
import ListManager from '@/lib/ListManager'
import KeyManager from '@/lib/KeyManager'
import Translator from '@/lib/Translator'
import PreferencesManager from '@/lib/PreferencesManager'

export default MComponent({
  name: 'MGV',
  components: {
    MHeader,
    MFooter,
    PageBox,
    PageBoxContainer,
    GenomeSelector,
    MyLists,
    SequenceCart,
    Settings,
    ListEditor,
    FindGenes,
    Facets,
    GenomeView,
    ZoomView,
    FeatureDetails
  },
  provide: function () {
    return {
      featureColorMap: this.featureColorMap,
      getFacets: function () {
        return this.$refs.facets
      }.bind(this),
      preferencesManager: function () {
        return this.preferencesManager
      }.bind(this),
      translator: function () {
        return this.translator
      }.bind(this),
      listManager: function () {
        return this.listManager
      }.bind(this),
      regionManager: function () {
        return this.regionManager
      }.bind(this)
    }
  },
  data: function () {
    return {
      // all genomes (order not important)
      allGenomes: [],
      // current reference genome
      rGenome: { name: '' },
      // current reference region
      rRegion: null,
      //
      currRegion: null,
      // predefined sets of genomes for easy selections
      genomeSets: [],
      // ----------------------------------------------------
      //
      scrollLock: false,
      // drawing mode
      dmode: 'direct', // one of: direct, landmark, mapped
      // Three ways to specify which regions to draw.
      // 1. Specify the regions explicitly. Each region is a genome+chr+start+end
      strips: [],
      // 2. Specify regions relative to a landmark.
      lcoords: {
        // alignment landmark
        landmark: null,
        // where on the landmark the alignment point is located
        // one of: fiveprime, threeprime, start, end, center
        alignTo: 'fiveprime',
        // delta in bp away from alignment point (for scrolling while aligned)
        delta: 0,
        // width of the region to show (in bp)
        length: 1000000,
        // for defining width as length(landmark) + 2*flank
        flank: 0
      },
      // 3. Specify a region in the ref genome. Use mapping to find regions in other genomes.
      coords: {
        chr: { name: '1' },
        start: 1,
        end: 10000000
      },
      // ----------------------------------------------------
      // is left drawer open
      drawerOpen: true,
      // while mouse is over a feature, its ID. Otherwise null.
      currentMouseover: null,
      // while mouse is over a transcript, its ID. Otherwise null.
      currentMouseoverT: null,
      // features to draw in the FeatureDetail section
      detailFeatures: [],
      // user lists
      lists: [],
      // currently selected features
      currentSelection: [],
      // currently displayed list
      currentList: null,
      // index into currently diaplayed list (for cycling through the features)
      currentListItem: 0,
      // current list as a Set for fast membership testing
      currentListSet: null,
      // list currently being edited
      currentEditList: null,
      // flag to indicate when there are currently enabled facets
      activeFacets: false,
      // visible Height minus header and footer
      visHeight: 350
    }
  },
  computed: {
    agIndex: function () {
      return this.allGenomes.reduce((ix, g) => { ix[g.name] = g; return ix }, {})
    },
    zoomWidth: function () {
      return this.$refs.zoomView.$refs.main.width
    },
    vGenomes: function () {
      return this.strips.map(s => s.genome)
    }
  },
  methods: {
    resize: function () {
      const sz = {width: u.wWidth(), height: u.wHeight()}
      this.visHeight = sz.height - 80
      this.$root.$emit('resize', sz)
    },
    // Returns a promise for a sanitized version of a context configuration.
    // Missing fields are filled in (usually with current values)
    // so that the returned config is a complete specification.
    // Also performs sanity checks (eg making sure start <= end).
    // Why a promise and not the thing directly? Because sanitizing may involve
    // resolving a landmark feature to actual coordinates.
    //
    sanitizeContext: function (cxt) {
      //
      let newc = {} // the new, sanitized context
      let r
      let n
      let nc

      //
      newc.currentMouseover = cxt.currentMouseover
      newc.currentMouseoverT = cxt.currentMouseoverT
      newc.currentSelection = cxt.currentSelection

      newc.ref = this.rGenome
      if (cxt.ref) {
        // get specified ref genome name and look it up
        n = cxt.ref.name || cxt.ref
        newc.ref = this.agIndex[n] || this.rGenome
      }
      //
      if (cxt.strips) {
        newc.strips = cxt.strips.map(r => {
          // validate region
          r.genome = this.agIndex[r.genome]
          if (!r.genome) return null
          r.regions = r.regions.map(rr => {
            try {
              rr = gc.validate(rr, r.genome, true)
            } catch (e) {
              return null
            }
            if (rr) rr.genome = r.genome
            return rr
          }).filter(x => x)
          return r
        }).filter(x => x)
        //
        if (newc.strips.length === 0) newc.strips = this.strips
        //
        newc.genomes = newc.strips.map(r => r.genome)
        if (newc.genomes.indexOf(newc.ref) === -1) newc.ref = newc.genomes[0]
        newc.lcoords = {
          landmark: null,
          delta: 0,
          length: 0
        }
        return Promise.resolve(newc)
      }
      //
      if (cxt.landmark === null) {
        // explicit null means stop aligning on the landmark
        newc.strips = this.strips
        return Promise.resolve(newc)
      }
      // If here, the new context specifes either mapped or landmark coordinates
      //
      // Resolve genomes. Assume genomes are given in the desired order.
      if (cxt.genomes) {
        if (!Array.isArray(cxt.genomes)) cxt.genomes = [cxt.genomes]
        cxt.genomes = cxt.genomes.map(g => {
          return this.allGenomes.filter(a => a.name === (g.name || g))[0]
        }).filter(x => x)
      } else {
        cxt.genomes = u.removeDups(this.strips.map(s => s.genome))
      }
      // if ref genome not included in genomes list, insert it at the front
      if (cxt.genomes.indexOf(newc.ref) === -1) cxt.genomes.unshift(newc.ref)
      newc.genomes = cxt.genomes

      //
      if (cxt.chr || cxt.start || cxt.end) {
        // handle normal coordinates spec
        n = cxt.chr ? (cxt.chr.name || cxt.chr) : this.coords.chr.name
        r = newc.ref.chromosomes.filter(c => c.name === n)[0]
        newc.coords = nc = gc.validate({
          chr: r,
          start: cxt.start || this.coords.start,
          end: cxt.end || this.coords.end
        }, newc.ref, true)
        newc.lcoords = {
          landmark: null,
          delta: 0,
          length: nc.end - nc.start + 1
        }
      } else if (cxt.landmark || typeof cxt.delta === 'number' || cxt.length) {
        // make sure the ref genome's features have been loaded before continuing
        // so we can resolve landmarks
        return this.dataManager.ensureFeatures(newc.ref).then(() => {
          // handle landmark spec
          let lm = this.dataManager.getGenolog(cxt.landmark || this.lcoords.landmark, newc.ref)
          if (lm) {
            newc.lcoords = {
              landmark: lm.cID || lm.ID,
              delta: typeof cxt.delta === 'number' ? cxt.delta : this.lcoords.delta,
              length: typeof cxt.length === 'number' ? cxt.length : this.lcoords.length
            }
            let x = (lm.strand === '+' ? lm.start : lm.end) + newc.lcoords.delta
            let ns = Math.floor(x - newc.lcoords.length / 2)
            newc.coords = {
              genome: newc.ref,
              chr: lm.chr,
              start: ns,
              end: ns + newc.lcoords.length - 1
            }
          }
          //
          return newc
        })
      } else if (cxt.landmark === null) {
        newc.coords = this.coords
        newc.lcoords = {
          landmark: null,
          delta: 0,
          length: this.lcoords.length
        }
      }
      return Promise.resolve(newc)
    },
    setContext: function (cxt0, quietly) {
      this.sanitizeContext(cxt0).then(cxt => {
        if (cxt.ref) this.rGenome = cxt.ref
        if (cxt.strips) {
          this.dmode = 'direct'
          this.regionManager.initializeRegions(cxt.strips)
        } else if (cxt.lcoords && cxt.lcoords.landmark) {
          this.dmode = 'landmark'
          this.lcoords = cxt.lcoords
          this.coords = cxt.coords
          this.regionManager.alignOnLandmark(cxt.lcoords, cxt.genomes)
        } else if (cxt.coords) {
          this.dmode = 'mapped'
          this.coords = cxt.coords
          this.regionManager.computeMappedRegions(cxt.coords, cxt.genomes)
        }
        if (cxt.currentMouseover) this.currentMouseover = cxt.currentMouseover
        if (cxt.currentMouseoverT) this.currentMouseoverT = cxt.currentMouseoverT
        if (cxt.currentSelection) this.currentSelection = cxt.currentSelection
        if (!quietly) this.$root.$emit('context-changed')
      })
    },
    unAlign: function () {
      this.dmode = 'direct'
      this.lcoords.landmark = null
      this.$root.$emit('context-changed')
    },
    getContextString: function () {
      let cs = this.regionManager.getParameterString()
      if (this.currentSelection.length) {
        cs = cs + '&' + `highlight=${this.currentSelection.join('+')}`
      }
      return cs
    },
    toggleDrawer: function () {
      this.drawerOpen = !this.drawerOpen
      window.setTimeout(this.resize.bind(this), this.cfg.animDur * 1000)
    },
    // FIXME All these handlers for features really belong somewhere else
    featureOver: function (f, t, e) {
      let fid = f.cID || f.ID
      this.currentMouseover = f
      this.currentMouseoverT = t
      if (e.ctrlKey || e.altKey) this.detailFeatures = this.dataManager.getGenologs(f, this.vGenomes)
    },
    featureOff: function (f, t, e) {
      this.currentMouseover = null
      this.currentMouseoverT = null
    },
    featureClick: function (f, t, e) {
      let fid = f.cID || f.ID
      let csel = this.currentSelection
      if (e.shiftKey) {
        let i = csel.indexOf(fid)
        if (i >= 0) {
          delete csel.splice(i, 1)
        } else {
          csel.push(fid)
        }
      } else {
        this.currentSelection = [fid]
      }
      this.detailFeatures = this.dataManager.getGenologs(f, this.vGenomes)
      this.$root.$emit('context-changed')
    },
    featureDblClick: function (f, t, e) {
      let id = f.symbol || f.cID || f.ID
      this.setContext({ landmark: id, delta: 0, currentSelection: [f.cID], ref: f.genome })
    },
    initKeyBindings () {
      this.keyManager.register({
       key: 't',
       handler: () => this.toggleDrawer(),
       thisObj: this
      })
      this.keyManager.register({
       key: 'l',
       handler: () => { this.scrollLock = !this.scrollLock },
       thisObj: this
      })
      this.keyManager.register({
       key: 'x',
       handler: () => { config.ZoomRegion.spreadTranscripts = !config.ZoomRegion.spreadTranscripts },
       thisObj: this
      })
      this.keyManager.register({
       key: '+',
       shiftKey: true,
       handler: () => {
         this.$root.$emit('region-change', {
           op: 'zoom',
           amt: 0.5,
         })
       },
       thisObj: this
      })
      this.keyManager.register({
       key: '-',
       handler: () => {
         this.$root.$emit('region-change', {
           op: 'zoom',
           amt: 2,
         })
       },
       thisObj: this
      })
      this.keyManager.register({
       key: 'ArrowRight',
       handler: () => {
         this.$root.$emit('region-change', {
           op: 'scroll',
           amt: -.2,
         })
       },
       thisObj: this
      })
      this.keyManager.register({
       key: 'ArrowLeft',
       handler: () => {
         this.$root.$emit('region-change', {
           op: 'scroll',
           amt: .2,
         })
       },
       thisObj: this
      })
    },
    //
    clearCacheAndReload () {
      const kstore = new KeyStore(config.CachingFetcher.dbName)
      kstore.clear().then(() => {
        const kstore2 = new KeyStore(config.PreferencesManager.dbName)
        return kstore2.clear()
      }).then(() => {
        window.location.reload()
      })
    }
  },
  beforeCreate: function () {
    //
    this.featureColorMap = new FeatureColorMap()
    //
    this.preferencesManager = new PreferencesManager(this)
  },
  created: function () {
    //
    this.keyManager = new KeyManager(document.body)
    //
    this.historyManager = new HistoryManager(this)
    //
    this.listManager = new ListManager(this, this.lists)
    //
    this.translator = new Translator(this)
    //
    this.regionManager = new RegionManager(this)
    //
    this.initKeyBindings()
  },
  mounted: function () {
    //
    this.genomeSets = this.cfg.genomeSets
    // a global handle for debugging
    window.app = this
    // be responsive to window size changes
    window.addEventListener('resize', () => this.resize())
    this.$nextTick(() => this.resize())

    //
    this.$root.$on('clear-cache-and-reload', () => {
      if (confirm('Clear data cache and reload this page. Are you sure?')) {
        this.clearCacheAndReload()
      }
    })
    //
    this.$root.$on('no-align', () => this.unAlign())
    // listen for context events - how descendant component announce they want to redraw
    // this.$root.$on('context', cxt => this.setContext(cxt))
    this.$root.$on('clear-selection', () => {
      this.currentSelection = []
      this.$root.$emit('context-changed')
    })
    //
    this.app.$root.$on('region-current', r => { this.currRegion = r ? r.region : null })
    //
    this.$root.$on('feature-over', arg => this.featureOver(arg.feature, arg.transcript, arg.event))
    this.$root.$on('feature-out', arg => this.featureOff(arg.feature, arg.transcript, arg.event))
    this.$root.$on('feature-click', arg => this.featureClick(arg.feature, arg.transcript, arg.event))
    //this.$root.$on('feature-dblclick', arg => this.featureDblClick(arg.feature, arg.transcript, arg.event))
    //
    this.$root.$on('list-click', data => {
      let lst = data.list || data
      let shift = data.event ? data.event.shiftKey : false
      if (lst === this.currentList) {
        if (shift) {
          // shift-click repeatedly on a list to step through its members
          this.currentListItem = (this.currentListItem + 1) % lst.items.length
        } else {
          this.currentList = null
          this.currentListSet = null
          this.currentListItem = 0
          return
        }
      } else {
        this.currentList = lst
        this.currentListSet = new Set(lst.items)
        this.currentListItem = 0
        if (!shift) return
      }
      let lm = lst.items[this.currentListItem]
      this.setContext({ landmark: lm, delta: 0, currentSelection: [lm] })
    })
    //
    this.$root.$on('list-delete', data => {
      if (this.currentList === data) {
        this.currentList = null
      }
    })
    //
    this.$root.$on('list-edit-new', data => {
      if (data) {
        this.currentEditList = this.listManager.newList(data.name, data.items, data.color)
      } else {
        this.currentEditList = null
        this.$refs.listEditor.open()
      }
    })
    //
    this.$root.$on('list-edit-newfromselected', () => {
      this.currentEditList = this.listManager.newList("selected", this.currentSelection, "#cccccc")
    })
    //
    this.$root.$on('list-edit-open', data => {
      this.currentEditList = data.list
      this.$refs.listEditor.open()
    })
    //
    this.$root.$on('list-edit-cancel', data => {
      this.currentEditList = null
    })
    //
    this.$root.$on('list-edit-save', data => {
      this.listManager.updateList(this.currentEditList, data)
    })
    //
    this.$root.$on('facet-state', data => {
      this.activeFacets = data.length > 0
    })
    //
    // Kick things off by getting all the genomes we know about and all their chomosomes 
    // (names and lengths).
    //
    this.dataManager.getGenomes().then(genomes => {
      // now set up the initial state
      this.allGenomes = genomes // all the genomes (at least one)
      this.rGenome = genomes[0] 
      this.$refs.genomeView.genome = this.allGenomes[0]
      // initial hash from page URL
      const ih = Object.assign({}, this.historyManager.initialHash)
      ih.width = u.wWidth()
      if (!ih.strips && !ih.chr && !ih.landmark) {
        const g = this.rGenome
        const c = g.chromosomes[0]
        ih.strips = [{
          genome: g.name,
          regions: [{
            genome: g.name,
            chr: c.name,
            start: 1,
            end: Math.min(10000000, c.length)
          }]
        }]
      }
      console.log('MGV: setting initial context', ih)
      this.setContext(ih, true)
    })
  }
})
</script>

<style>
html, body {
  height: 100%;
  margin: 0px;
}
/* -----------------------------------------
 * Global styles for the app
 * -----------------------------------------
 */

.mgv-app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  width: 100%;
  height: 100%;
}

/* -----------------------------------------
 * flexrow and flexcolumn
 * -----------------------------------------
 */
.flexrow {
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
  flex-grow: 1;
}

.flexcolumn {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  flex-grow: 1;
}

.flexrow > *,
.flexcolumn > * {
  padding: 2px;
}

button:hover {
  font-weight: bold;
}

.rotating {
    transform-origin: 50% 50%;
    -webkit-animation: rotation 2s infinite linear;
}

.rotateOnce {
    transform-origin: 50% 50%;
    -webkit-animation: rotation 2s linear;
}

@-webkit-keyframes rotation {
    from {
        -webkit-transform: rotate(0deg);
    }
    to {
        -webkit-transform: rotate(-359deg);
    }
}

[name="content"] {
  align-items: flex-start;
}
[name="leftColumn"] {
  transition: min-width 0.5s, max-width 0.5s, opacity 0.5s;
}
[name="leftColumn"].open {
  min-width: 250px;
  max-width: 250px;
  opacity: 1;
}
[name="leftColumn"].closed {
  min-width: 0px;
  max-width: 0px;
  opacity: 0;
}
svg {
    width: 100%;
}
</style>
