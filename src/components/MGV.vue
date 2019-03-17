<template>
  <div class="mgv-app">
    <div class="flexcolumn">
      <m-header @gear-clicked="toggleDrawer"></m-header>
      <div name="content" class="flexrow">
        <!--
        ============ Left column ==============================================
        -->
        <page-box-container
          name="leftColumn"
          class="flexcolumn"
          :class="{ open: drawerOpen, closed: !drawerOpen}"
          >
          <!--
          ============ Genomes ==============
          -->
          <page-box label="Genomes">
            <genome-selector
              title="Select one genome as the reference and any number of genomes as comparisons."
              :allGenomes="allGenomes"
              :vGenomes="vGenomes"
              :rGenome="rGenome"
              :genomeSets="genomeSets"
              />
          </page-box>
          <!--
          ============ Find Genes ==============
          -->
          <page-box label="Find genes">
            <find-genes
              ref="findGenes"
              title="Search MouseMine for genes annotated to specified diseases, pathways, etc. Pick a search type, enter a search term and hit enter. Results are returned in a new list (see MyLists)."
              />
          </page-box>
          <!--
          ============ My Lists ==============
          -->
          <page-box label="My lists">
            <my-lists
              title="Shows your current lists. A list simply contains identifiers. Click on a list to show its items in the genome view; click again to hide them. Click on the 'x' to delete a list. Click on the pencil to edit the list (see ListEditor)."
              :lists="lists"
              :currentList="currentList"
              />
          </page-box>
          <!--
          ============ List Editor ==============
          -->
          <page-box
            label="List editor"
            :floating="true"
            :initialX="250"
            :initialY="337"
            :initiallyOpen="false"
            iconClose="close"
            ><list-editor
              title="Examine/modify the contents of a list. Create a new list. Combine lists with intersection, union, and difference."
              :list="currentEditList"
              ref="listEditor"
              />
          </page-box>
          <!--
          ============ Facets (aka Filters) ==============
          -->
          <page-box
            :message="activeFacets ? 'There are active filters. Some features may not be visible.' : ''"
            label="Filters">
            <facets
              title="Limit what feature are displayed by different criteria."
              ref="facets"
              />
          </page-box>
          <!--
          ============ Settings ==============
          -->
          <page-box label="Settings">
            <settings
              title="Settings."
              ref="settings"
              />
          </page-box>
        </page-box-container>
        <!--
        ============ Right column ==============================================
        -->
        <page-box-container name="rightColumn" class="flexcolumn">
          <!--
          ============ Genome View ==============
          -->
          <page-box label="GenomeView">
            <genome-view
              :context="$data"
              ref="genomeView"
              title="When open, shows the reference genome's chromosomes as vertical lines. When closed, shows the current chromosome as a horizontal line. Click (drag) on a chromosome to jump (zoom) to that location. Red circles show current list items (if any). Click on a circle to jump to that feature."
              />
          </page-box>
          <!--
          ============ Feature Details ==========
          -->
          <page-box label="FeatureDetails">
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
            label="ZoomView">
            <zoom-view
              :context="$data"
              ref="zoomView"
              title="The main view. Shows features in the current region of the reference genome and all selected comparison genomes. Highlights features in the view that are currently selected. Many controls for panning, zooming, selecting, etc. Most anything can be undone by hitting the browser's Back button."
              />
          </page-box>
          <!--
          ============== Multiple Sequence Alignment ==============
          -->
          <page-box
            :initiallyOpen="false"
            label="Sequences">
            <sequences
              ref="msa"
              title="Forwards selected sequences to the specified alignment tool at Ensembl."
              ></sequences>
            </page-box>
        </page-box-container>
      </div>
      <m-footer version="1.0.0"></m-footer>
    </div>
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
import Sequences from '@/components/Sequences'
import FeatureDetails from '@/components/FeatureDetails'
import FeatureColorMap from '@/lib/FeatureColorMap'
import MComponent from '@/components/MComponent'
import gc from '@/lib/GenomeCoordinates'
import HistoryManager from '@/lib/HistoryManager'
import ListManager from '@/lib/ListManager'
import KeyManager from '@/lib/KeyManager'
import Translator from '@/lib/Translator'
import PreferencesManager from '@/lib/PreferencesManager'
//
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
    Sequences,
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
      }.bind(this)
    }
  },
  data: function () {
    return {
      // is left drawer open
      drawerOpen: true,
      // all genomes (order not important)
      allGenomes: [],
      // visible genomes (in viewing order)
      vGenomes: [],
      // current reference genome
      rGenome: { name: '' },
      // predefined sets of genomes for easy selections
      genomeSets: [],
      // absolute coordinates
      coords: {
        chr: { name: '1' },
        start: 1,
        end: 10000000
      },
      // landmark coordinates
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
      activeFacets: false
    }
  },
  computed: {
    agIndex: function () {
      return this.allGenomes.reduce((ix, g) => { ix[g.name] = g; return ix }, {})
    }
  },
  methods: {
    // Returns a promise for the list of genome info objects
    initializeData: function () {
    },
    resize: function () {
      this.$root.$emit('resize')
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
      // resolve ref genome. If none specified, use current ref
      newc.ref = this.rGenome
      if (cxt.ref) {
        // get specified ref genome name and look it up
        n = cxt.ref.name || cxt.ref
        newc.ref = this.agIndex[n] || this.rGenome
      }
      // make sure this genome's features have been loaded before continuing
      return this.dataManager.ensureFeatures(newc.ref).then(() => {
        //
        // resolve genomes. Here we assume genomes are given in the desired order.
        if (cxt.genomes) {
          if (!Array.isArray(cxt.genomes)) cxt.genomes = [cxt.genomes]
          cxt.genomes = cxt.genomes.map(g => {
            return this.allGenomes.filter(a => a.name === (g.name || g))[0]
          }).filter(x => x)
        } else {
          cxt.genomes = this.vGenomes.slice()
        }
        // if ref genome not included in genomes list, insert it at the front
        if (cxt.genomes.indexOf(newc.ref) === -1) cxt.genomes.unshift(newc.ref)
        newc.genomes = cxt.genomes

        // resolve coordinates
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
        } else if (cxt.landmark === null) {
          newc.coords = this.coords
          newc.lcoords = {
            landmark: null,
            delta: 0,
            length: this.lcoords.length
          }
        } else if (cxt.landmark || typeof cxt.delta === 'number' || cxt.length) {
          // handle landmark spec
          let lm = this.dataManager.getGenolog(cxt.landmark || this.lcoords.landmark, newc.ref)
          if (lm) {
            newc.lcoords = {
              landmark: lm.symbol || lm.cID || lm.ID,
              delta: typeof cxt.delta === 'number' ? cxt.delta : this.lcoords.delta,
              length: typeof cxt.length === 'number' ? cxt.length : this.lcoords.length
            }
            let x = (lm.strand === '+' ? lm.start : lm.end) + newc.lcoords.delta
            let ns = Math.floor(x - newc.lcoords.length / 2)
            newc.coords = {
              chr: lm.chr,
              start: ns,
              end: ns + newc.lcoords.length - 1
            }
          } else {
            // could not resolve the landmark in the ref genome. no change
            newc.coords = this.coords
            newc.lcoords = this.lcoords
          }
        } else {
          // no change
          newc.coords = this.coords
          newc.lcoords = this.lcoords
        }
        //
        // currentMouseover
        newc.currentMouseover = cxt.currentMouseover === undefined ? this.currentMouseover : cxt.currentMouseover
        newc.currentMouseoverT = cxt.currentMouseoverT === undefined ? this.currentMouseoverT : cxt.currentMouseoverT
        //
        // current selection
        newc.currentSelection = cxt.currentSelection || this.currentSelection
        //
        return newc
      })
    },
    setContext: function (cxt0, quietly) {
      this.sanitizeContext(cxt0).then(cxt => {
        this.rGenome = cxt.ref
        // this.vGenomes.splice(0, this.vGenomes.length, ...cxt.genomes)
        this.vGenomes = cxt.genomes
        this.coords = cxt.coords
        this.lcoords = cxt.lcoords
        this.currentMouseover = cxt.currentMouseover
        this.currentMouseoverT = cxt.currentMouseoverT
        this.currentSelection = cxt.currentSelection
        if (!quietly) this.$root.$emit('context-changed', cxt)
      })
    },
    getContextString: function () {
      let parms = [
        `ref=${this.rGenome.name}`,
        `genomes=${this.vGenomes.map(vg => vg.name).join('+')}`
      ]
      if (this.lcoords.landmark) {
        parms = parms.concat([
          `landmark=${this.lcoords.landmark}`,
          `delta=${this.lcoords.delta}`,
          `length=${this.lcoords.length}`
        ])
      } else {
        parms = parms.concat([
          `chr=${this.coords.chr.name}`,
          `start=${this.coords.start}`,
          `end=${this.coords.end}`
        ])
      }
      if (this.currentSelection.length) {
        parms.push(`highlight=${this.currentSelection.join('+')}`)
      }
      return parms.join('&')
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
      if (e.altKey) {
        if (this.currentSelection.indexOf(fid) === -1) {
          this.currentSelection.push(fid)
          // Don't register context changes until user has paused for at least 1s.
          if (this.timeout) window.clearTimeout(this.timeout)
          this.timeout = window.setTimeout(() => {
            this.setContext({ currentSelection: this.currentSelection })
          }, 1000)
        }
      }
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
    },
    featureDblClick: function (f, t, e) {
      let id = f.symbol || f.cID || f.ID
      this.setContext({ landmark: id, delta: 0, currentSelection: [f.cID], ref: f.genome })
    }
  },
  beforeCreate: function () {
    //
    this.featureColorMap = new FeatureColorMap()
    //
    this.preferencesManager = new PreferencesManager(this)
  },
  mounted: function () {
    //
    this.keyManager = new KeyManager(this)
    this.keyManager.register({
     key: 'o',
     ctrlKey: true,
     handler: () => this.toggleDrawer()
    })
    //
    this.genomeSets = this.cfg.genomeSets
    // a global handle for debugging
    window.app = this
    // be responsive to window size changes
    window.onresize = () => this.resize()
    //
    this.historyManager = new HistoryManager(this)
    //
    this.listManager = new ListManager(this, this.lists)
    //
    this.translator = new Translator(this)
    //
    // listen for context events - how descendant component announce they want to redraw
    this.$root.$on('context', cxt => this.setContext(cxt))
    //
    this.$root.$on('feature-over', arg => this.featureOver(arg.feature, arg.transcript, arg.event))
    this.$root.$on('feature-out', arg => this.featureOff(arg.feature, arg.transcript, arg.event))
    this.$root.$on('feature-click', arg => this.featureClick(arg.feature, arg.transcript, arg.event))
    this.$root.$on('feature-dblclick', arg => this.featureDblClick(arg.feature, arg.transcript, arg.event))
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
    // Kick things off by getting all the genomes we know about and all their chomosomes (names and lengths)
    //
    this.dataManager.getGenomes().then(genomes => {
      console.log('MGV: setting initial context', this.historyManager.initialHash)
      this.allGenomes = genomes // all the genomes (at least one)
      this.rGenome = genomes[0] // current reference genome (always set)
      this.vGenomes = [genomes[0]] // currently visible genomes (always contains reference)
      this.setContext(this.historyManager.initialHash, true)
    })
  }
})
</script>

<style>
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
  justify-content: space-between;
  flex-wrap: nowrap;
  flex-grow: 1;
}

.flexrow > *,
.flexcolumn > * {
  padding: 2px;
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
  max-width: 350px;
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
