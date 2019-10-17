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
        ============ Genomes ==============
        -->
        <page-box
          label="Genomes"
          icon="list"
          >
          <genome-selector
            :allGenomes="allGenomes"
            :strips="strips"
            :genomeSets="genomeSets"
            :rGenome="rGenome"
            title="Specify which genome(s) to display."
            ref="genomes"
            />
        </page-box>
        <!--
        ============ Gene Lists ==============
        -->
        <page-box
          label="Lists and searches"
          icon="list"
          >
          <my-lists
            title="Create, display, and save lists of genes. A list simply contains identifiers. Create lists via searches, pasting identifiers, or combining other lists.  Click on a list to show its items in the genome view; click again to hide them. Click on the 'x' to delete a list. Click on the pencil to edit the list."
            ref="myLists"
            :lists="lists"
            :currentList="currentList"
            />
        </page-box>
        <!--
        ============ Facets (aka Filters) ==============
        -->
        <page-box
          :message="activeFacets.length ? 'There are active filters. Click to clear.' : ''"
          :messageClickHandler="clearFacets"
          label="Filters"
          icon="filter_list"
          >
          <facets
            title="Limit what features are displayed by different criteria."
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
            title="Contains sequence (descriptors) that you select while browsing. Download sequences as Fasta, with options to reverse complement genomic sequences or translate CDSs."
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
        ============== Zoom View ==============
        -->
        <page-box
          :message="activeFacets.length ? `Active filters (click to remove):\n${activeFacetsText}` : ''"
          :messageClickHandler="clearFacets"
          label="ZoomView"
          icon="view_agenda"
          >
          <zoom-view
            :context="$data"
            ref="zoomView"
            title="The main view. Shows features in selected regions of selected genomes. You can zoom, scroll, find genes, download sequences and more. These operations can affect regions independently or in synch using the lock icon. Most things can be undone using the browser's Back button."
            />
        </page-box>
        <!--
        ============== Gene View ==============
        <page-box
          label="GeneView"
          icon="view_agenda"
          >
          <gene-view
            :genes="detailFeatures"
            :spreadTranscripts="false"
            ref="geneView"
            title="GeneView shows the details of a single gene."
            />
        </page-box>
        -->
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
            title="Shows details of a feature you click on. When open, shows details for homologs in all currently displayed genomes. When closed, shows only the feature in the genome that was clicked."
            :features="detailFeatures"
            :currentMouseover="currentMouseover"
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
      <!--
      ============ Help Screen  ==============
      -->
      <page-box
        label="MGV Help"
        :floating="true"
        :initialX="350"
        :initialY="150"
        :initiallyOpen="false"
        ref="helpBox"
        >
        <help-box
          />
      </page-box>
    </div>
    <m-footer version="1.0.0"></m-footer>
    <!--
    ============ Messages  ==============
    -->
    <messages
      ref="messages"
      />
  </div>
</template>

<script>
//
import Facets from '@/components/Facets'
import FeatureColorMap from '@/lib/FeatureColorMap'
import FeatureDetails from '@/components/FeatureDetails'
import FindGenes from '@/components/FindGenes'
import GeneView from '@/components/GeneView'
import GenomeSelector from '@/components/GenomeSelector'
import GenomeView from '@/components/GenomeView'
import HelpBox from '@/components/HelpBox'
import ListEditor from '@/components/ListEditor'
import MComponent from '@/components/MComponent'
import Messages from '@/components/Messages'
import MFooter from '@/components/MFooter'
import MHeader from '@/components/MHeader'
import MyLists from '@/components/MyLists'
import PageBox from '@/components/PageBox'
import PageBoxContainer from '@/components/PageBoxContainer'
import Settings from '@/components/Settings'
import SequenceCart from '@/components/SequenceCart'
import ZoomView from '@/components/ZoomView'
//
import config from '@/config'
import gc from '@/lib/GenomeCoordinates'
import u from '@/lib/utils'
//
import DataManager from '@/lib/DataManager'
import HistoryManager from '@/lib/HistoryManager'
import KeyManager from '@/lib/KeyManager'
import KeyStore from '@/lib/KeyStore'
import ListManager from '@/lib/ListManager'
import PreferencesManager from '@/lib/PreferencesManager'
import RegionManager from '@/lib/RegionManager'
//
export default MComponent({
  name: 'MGV',
  components: {
    Facets,
    FeatureDetails,
    FindGenes,
    GeneView,
    GenomeView,
    GenomeSelector,
    HelpBox,
    ListEditor,
    Messages,
    MHeader,
    MFooter,
    MyLists,
    PageBox,
    PageBoxContainer,
    SequenceCart,
    Settings,
    ZoomView
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
      listManager: function () {
        return this.listManager
      }.bind(this),
      regionManager: function () {
        return this.regionManager
      }.bind(this),
      dataManager: function () {
        return this.dataManager
      }.bind(this)
    }
  },
  data: function () {
    return {
      // all genomes (order not important)
      allGenomes: [],
      // current reference genome
      rGenome: { name: '' },
      // current region = most recently clicked
      currRegion: null,
      // predefined sets of genomes for easy selections
      genomeSets: [],
      // when true, all regions scroll (and zoom and select sequenc) in sync.
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
      // list of currently active facets
      activeFacets: [],
      // visible Height minus header and footer
      visHeight: 350
    }
  },
  computed: {
    currentSelectionSet: function () {
      return new Set(this.currentSelection)
    },
    agIndex: function () {
      return this.allGenomes.reduce((ix, g) => { ix[g.name] = g; return ix }, {})
    },
    zoomWidth: function () {
      return this.$refs.zoomView.$refs.main.width
    },
    vGenomes: function () {
      return this.strips.map(s => s.genome)
    },
    activeFacetsText: function () {
      return this.activeFacets.map(f => {
        return `${f.facet} [${f.values.join(", ")}]`
      }).join("\n")
    },
    rStrip: function () {
      return this.strips.filter(s => s.genome === this.rGenome)[0]
    }
  },
  methods: {
    clearFacets: function () {
      this.$refs.facets.resetAll()
    },
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
      newc.currentSelection = cxt.currentSelection
      //
      newc.ref = null
      if (cxt.ref) {
        // get specified ref genome name and look it up
        n = cxt.ref.name || cxt.ref
        newc.ref = this.agIndex[n] || null
      }
      //
      newc.locked = !cxt.ref && (cxt.locked === "on")
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
        if (newc.genomes.indexOf(newc.ref) === -1) newc.ref = null
        newc.lcoords = {
          landmark: null,
          delta: 0,
          length: 0
        }
        return Promise.resolve(newc)
      }
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
          let lm = this.dataManager.getHomologs(cxt.landmark || this.lcoords.landmark, newc.ref)[0]
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
        this.currentSelection = cxt.currentSelection
        this.rGenome = cxt.ref
        this.scrollLock = cxt.locked
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
      if (this.currentSelection && this.currentSelection.length) {
        cs = cs + '&' + `highlight=${this.currentSelection.join('+')}`
      }
      return cs
    },
    openDrawer: function () {
      if (!this.drawerOpen) this.toggleDrawer()
    },
    closeDrawer: function () {
      if (this.drawerOpen) this.toggleDrawer()
    },
    toggleDrawer: function () {
      this.drawerOpen = !this.drawerOpen
      window.setTimeout(this.resize.bind(this), this.cfg.animDur * 1000)
    },
    // FIXME All these handlers for features really belong somewhere else
    featureOver: function (f, t, e) {
      this.currentMouseover = f
      this.currentMouseoverT = t
      if (e.ctrlKey || e.altKey) this.detailFeatures = this.dataManager.getHomologs(f, this.vGenomes)
    },
    featureOff: function (f, t, e) {
      this.currentMouseover = null
      this.currentMouseoverT = null
    },
    featureClick: function (f, t, e) {
      this.detailFeatures = this.dataManager.getHomologs(f, this.vGenomes)
      const fids = Array.from(new Set(this.detailFeatures.filter(x => x).map(f => f.cID || f.ID)))
      const csel = this.currentSelection
      if (e.shiftKey) {
        fids.forEach(fid => {
          let i = csel.indexOf(fid)
          if (i >= 0) {
            // delete csel.splice(i, 1)
          } else {
            csel.push(fid)
          }
        })
      } else {
        this.currentSelection = fids
      }
      this.$root.$emit('selection-state-changed')
      this.$root.$emit('context-changed')
    },
    initKeyBindings () {
      this.keyManager.register({
       key: 'h',
       handler: () => this.$refs.helpBox.toggleOpen(),
       thisObj: this
      })
      this.keyManager.register({
       key: 't',
       handler: () => this.toggleDrawer(),
       thisObj: this
      })
      this.keyManager.register({
       key: 'l',
       handler: () => {
         this.$root.$emit('region-change', { op : this.scrollLock ? 'clear-lock-mode' : 'set-lock-mode'})
       },
       thisObj: this
      })
      this.keyManager.register({
       key: 'r',
       handler: () => {
         if (this.rGenome) {
           this.$root.$emit('region-change', { op: 'clear-ref-genome' })
         } else {
           const s = this.$refs.zoomView.getTopStrip()
           s && this.$root.$emit('region-change', { op: 'set-ref-genome', genome: s.genome })
         }
       },
       thisObj: this
      })
      this.keyManager.register({
       key: 'x',
       handler: () => { config.ZoomRegion.spreadTranscripts = !config.ZoomRegion.spreadTranscripts },
       thisObj: this
      })
      this.keyManager.register({
       key: 'ArrowUp',
       handler: (e) => {
         this.$root.$emit('region-change', {
           op: 'zoom',
           amt: e.shiftKey ? 0.1 : 0.5
         })
       },
       thisObj: this
      })
      this.keyManager.register({
       key: 'ArrowDown',
       handler: (e) => {
         this.$root.$emit('region-change', {
           op: 'zoom',
           amt: e.shiftKey ? 10 : 2
         })
       },
       thisObj: this
      })
      this.keyManager.register({
       key: 'ArrowRight',
       handler: (e) => {
         this.$root.$emit('region-change', {
           op: 'scroll',
           amt: e.shiftKey ? 0.8 : 0.2,
           sType: '%'
         })
       },
       thisObj: this
      })
      this.keyManager.register({
       key: 'ArrowLeft',
       handler: (e) => {
         this.$root.$emit('region-change', {
           op: 'scroll',
           amt: e.shiftKey ? -0.8 : -0.2,
           sType: '%'
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
    },
    purgeAndExit () {
      const allKstores = [
        config.CachingFetcher.dbName,
        config.PreferencesManager.dbName,
        config.ListManager.dbName,
        config.SequenceCart.dbName,
      ]
      Promise.all(allKstores.map(ks => (new KeyStore(ks)).clear())).then(() => {
        window.location = this.runtimeConfig.exitUrl
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
    this.runtimeConfig = this.$root.config
    //
    this.dataManager = new DataManager(this)
    //
    this.keyManager = new KeyManager(document.body)
    //
    this.historyManager = new HistoryManager(this)
    //
    this.listManager = new ListManager(this, this.lists)
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
    this.$root.$on('purge-and-exit', () => {
      if (confirm('Delete all data associated with this MGV instance. Includes lists, sequence cart items, preferences and cached data. Are you sure?')) {
        this.purgeAndExit()
      }
    })
    //
    this.$root.$on('no-align', () => this.unAlign())
    //
    this.$root.$on('clear-selection', () => {
      this.currentSelection = []
      this.$root.$emit('selection-state-changed')
      this.$root.$emit('context-changed')
    })
    //
    this.app.$root.$on('region-current', r => { this.currRegion = r ? r.region : null })
    //
    this.$root.$on('feature-over', arg => this.featureOver(arg.feature, arg.transcript, arg.event))
    this.$root.$on('feature-out', arg => this.featureOff(arg.feature, arg.transcript, arg.event))
    this.$root.$on('feature-click', arg => this.featureClick(arg.feature, arg.transcript, arg.event))
    //
    this.$root.$on('list-click', data => {
      let lst = data.list || data
      let shift = data.event ? data.event.shiftKey : false
      if (lst.items.length === 0) {
          this.currentList = null
          this.currentListSet = null
          this.currentListItem = 0
          return
      }
      if (lst === this.currentList) {
        if (shift) {
          // shift-click repeatedly on a list to step through its members
          this.currentListItem = (this.currentListItem + 1) % lst.items.length
        } else {
          this.currentList = null
          this.currentListSet = null
          this.currentListItem = 0
	  this.$root.$emit('list-selection', null)
          return
        }
      } else {
        this.currentList = lst
        this.currentListSet = new Set(lst.items)
        this.currentListItem = 0
	this.$root.$emit('list-selection', this.currentList)
        if (!shift) return
      }
      let lm = lst.items[this.currentListItem]
      let lmf = this.dataManager.getFeaturesBy(lm)[0]
      if (lmf) this.$root.$emit('region-change', { op : 'feature-align', feature: lmf })
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
      this.activeFacets = data
    })
    //
    // Kick things off by getting all the genomes we know about and all their chomosomes 
    // (names and lengths).
    //
    this.dataManager.getGenomes().then(genomes => {
      const byName = (a,b) => a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)
      const part1 = genomes.filter(g => g.name.indexOf(".") === -1).sort(byName)
      const part2 = genomes.filter(g => g.name.indexOf(".") !== -1).sort(byName)
      genomes = part1.concat(part2)
      // now set up the initial state
      this.allGenomes = genomes // all the genomes (at least one)
      this.$refs.genomeView.genome = this.allGenomes[0]
      // initial hash from page URL
      const ih = Object.assign({}, this.historyManager.initialHash)
      ih.width = u.wWidth()
      // console.log('MGV: setting initial context', ih)
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
  min-width: 260px;
  max-width: 260px;
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
