<template>
  <div class="mgv-app">
    <m-header @gear-clicked="toggleDrawer" ref="header"></m-header>
    <div name="content" class="flexrow">
      <!--
      ============ Left column ==============================================
      -->
      <page-box-container
        name="leftColumn"
        ref="toolDrawer"
        class="flexcolumn"
        :class="{ open: drawerOpen, closed: !drawerOpen}"
        :style="{ height: visHeight + 'px' }"
        >
        <!--
        ============ Genomes ==============
        -->
        <page-box
          label="Genomes"
          icon="folder_copy"
          >
          <genome-selector
            :allGenomes="allGenomes"
            :strips="strips"
            :genomeSets="genomeSets"
            :rGenome="rGenome"
            ref="genomes"
            />
        </page-box>
        <!--
        ============ Gene Lists ==============
        -->
        <page-box
          label="Gene lists"
          icon="list"
          >
          <my-lists
            ref="myLists"
            :lists="lists"
            :currentList="currentList"
            />
        </page-box>
        <!--
        ============ Facets (aka Filters) ==============
        -->
        <page-box
          label="Filters"
          icon="filter_alt"
          >
          <facets
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
            ref="settings"
            />
        </page-box>
        <!--
        ============ Sequence Cart ==============
        -->
        <page-box
          label="Sequence Cart"
          icon="shopping_cart"
          >
          <sequence-cart
            ref="sequenceCart"
            />
        </page-box>
      </page-box-container>
      <!--
      ============ Right column ==============================================
      -->
      <page-box-container
        name="rightColumn"
        :style="{ height: visHeight + 'px' }"
        class="flexcolumn">
        <!--
        ============== Zoom View ==============
        -->
        <page-box
          label="Zoom View"
          icon="view_agenda"
          >
          <zoom-view
            :context="$data"
            ref="zoomView"
            />
        </page-box>
        <!--
        ============ Genome View ==============
        -->
        <page-box
          label="Genome View"
          icon="language"
          >
          <genome-view
            :context="$data"
            ref="genomeView"
            />
        </page-box>
        <!--
        ============ Feature Details ==========
        -->
        <page-box
          label="Feature Details"
          icon="description"
          >
          <feature-details
            ref="featureDetails"
            :genes="csSetH"
            :transcripts="currentSelectionT"
            :exons="currentSelectionE"
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
        label="List Editor"
        :floating="true"
        :initialX="250"
        :initialY="100"
        :initiallyOpen="false"
        iconClose="close"
        ><list-editor
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
        :initialX="65"
        :initialY="150"
        :initiallyOpen="false"
        ref="helpBox"
        >
        <help-box
          />
      </page-box>
    </div>
    <m-footer ref="footer"></m-footer>
  </div>
</template>

<script>
//
import ga from '@/lib/mgi_ga'
//
import Facets from '@/components/Facets'
import FeatureColorMap from '@/lib/FeatureColorMap'
import FeatureDetails from '@/components/FeatureDetails'
import FindGenes from '@/components/FindGenes'
import GenomeSelector from '@/components/GenomeSelector'
import GenomeView from '@/components/GenomeView'
import HelpBox from '@/components/HelpBox'
import ListEditor from '@/components/ListEditor'
import MComponent from '@/components/MComponent'
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
    GenomeView,
    GenomeSelector,
    HelpBox,
    ListEditor,
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
      // grand total of objects in memory (see DataManager.js)
      objectsInMemory : 0,
      // current reference genome
      rGenome: { name: '' },
      // current region = most recently clicked
      currRegion: null,
      // predefined sets of genomes for easy selections
      genomeSets: [],
      // when true, all regions scroll (and zoom and select sequenc) in sync.
      scrollLock: false,
      // the regions to draw for each selected genome.
      strips: [],
      // ----------------------------------------------------
      // is left drawer open
      drawerOpen: true,
      // while mouse is over a feature, the feature object. Otherwise null.
      currentMouseover: null,
      // while mouse is over a transcript, the transcript object. Otherwise null.
      currentMouseoverT: null,
      // while mouse is over an exon, the exon object. Otherwise null.
      currentMouseoverE: null,
      // user lists
      lists: [],
      // currently selected features
      currentSelection: [],
      // currently selected transcripts
      currentSelectionT: [],
      // currently selected exons
      currentSelectionE: [],
      // currently displayed list
      currentList: null,
      // index into currently diaplayed list (for cycling through the features)
      currentListItem: 0,
      // current list as a set of ids. Includes homologs.
      currentListSet: null,
      //  current list as a set of ids. Excludes homologs.
      currentListSetStrict: null,
      // list currently being edited
      currentEditList: null,
      // list of currently active facets
      activeFacets: [],
      // visible Height minus header and footer
      visHeight: 350,
      //
      config: config,
      //
      debug: false
    }
  },
  computed: {
    // Returns a promise that resolves when all visible genomes have cached their features
    gdReady () {
        return Promise.all(this.vGenomes.map(g => this.dataManager.ensureFeatures(g)))
    },
    // Returns the currentMouseover as a Set of (0 or 1) features
    cmSet: function () {
        return this.currentMouseover ? new Set([this.currentMouseover]) : new Set()
    },
    // Returns current mouseover and its homologs as a set of features
    cmSetH: function () {
        const h = this.currentMouseover ? this.dataManager.getHomologs(this.currentMouseover) : []
        return new Set(h)
    },
    // Returns current mouseover exons as a Set. 
    cmSetE () {
        const cme = this.currentMouseoverE
        if (!cme) return new Set()
        if (cme.de) return new Set([cme, cme.de])
        if (cme.tExons) return new Set([cme].concat(cme.tExons))
        // should never get here
        throw "Bad currentMouseoverE."
    },
    // Returns current mouseover transcripts as a set
    cmSetT () {
        const cme = this.currentMouseoverE
        const cmt = u.arrayify(this.currentMouseoverT)
        if (cme) {
            if (cme.transcript) {
                return new Set([cme.transcript])
            } else {
                return new Set(cme.tExons.map(te => te.transcript))
            }
        } else {
            return new Set(cmt)
        }
    },
    // returns current feature selection as a Set
    csSet: function () {
        return new Set(this.currentSelection)
    },
    // returns current transcript selection as a Set
    csSetT: function () {
        return new Set(this.currentSelectionT)
    },
    // returns current exon selection as a Set
    csSetE: function () {
        return new Set(this.currentSelectionE)
    },
    // returns current selection and all their homologs (for currently visible genomes) as a Set of features
    csSetH: function () {
        const csHomologs = this.currentSelection.map(f => this.dataManager.getHomologs(f))
        return new Set(u.flatten(csHomologs))
    },
    // returns current selection and all their homologs (for currently visible genomes) as a list of features
    csListH: function () {
        return Array.from(this.csSetH)
    },
    // Returns current list as a set of features
    clSet : function () {
        if (this.currentList && this.vGenomes) {
            const feats = this.currentList.items.map(cid => this.dataManager.getFeaturesBy(cid))
            return new Set(u.flatten(feats))
        } else {
            return new Set()
        }
    },
    // Returns current list with their homologs as a set of features
    clSetH : function () {
        const ans = new Set()
        for (let f of this.clSet) {
            this.dataManager.getHomologs(f).forEach(h => ans.add(h))
        }
        return ans
    },
    // Returns set of features currently selected, moused over, or in current list.
    cSet: function () {
        return u.set.union(this.cmSet, this.csSet, this.clSet)
    },
    // 
    // FIXME: refactor the existing calls
    //
    currentSelectionToList: function () {
      const s = new Set(this.currentSelection.map(f => f.curie).filter(x=>x))
      return Array.from(s)
    },
    currentSelectionToListWithHoms: function () {
      const cHoms = this.currentSelection.map(f => this.dataManager.getHomologs(f, this.vGenomes))
      const cHomIds = new Set(u.flatten(cHoms).map(f => f.curie).filter(x=>x))
      return Array.from(cHomIds)
    },
    // Returns the set of canonical IDs homologous to anything in the current selection
    currentSelectionSet: function () {
      const sids = u.flatten(this.currentSelection.map(f => this.dataManager.getHomologCids(f)))
      return new Set(sids)
    },
    currentSelectionLabel: function () {
      const ids = Array.from(new Set(this.currentSelection.map(f => f.label)))
      ids.sort()
      return ids.join(", ")
    },
    // Returns the set of canonical IDs homologous to the current mouseover.
    currentMouseoverSet: function () {
      if (this.currentMouseover) {
        const f = this.currentMouseover
        return new Set(this.dataManager.getHomologCids(f))
      } else {
        return new Set()
      }
    },
    // Returns a Map from genome to the Set of currently selected features for which the genome contains no homolog
    missingByGenome: function () {
        //const feats = this.currentSelection.concat(this.currentMouseover ? [this.currentMouseover] : [])
        const feats = this.cSet
        const g2missing = this.vGenomes.reduce((m,g) => {
            const gmissing = new Set()
            m.set(g, gmissing)
            feats.forEach(f => {
                const fhoms = this.dataManager.getHomologs(f, g)
                if (fhoms.length === 0) {
                    gmissing.add(f)
                }
            })
            return m
        }, new Map())
        return g2missing
    },
    agIndex: function () {
      return this.allGenomes.reduce((ix, g) => {
          ix[g.name] = g
          ix[g.path] = g
          if (g.shortname) ix[g.shortname] = g
          return ix
      }, {})
    },
    zoomWidth: function () {
      return this.$refs.zoomView.$refs.main.width
    },
    vGenomes: function () {
      return this.strips.map(s => s.genome)
    },
    vTaxons: function () {
      return Array.from(new Set(this.vGenomes.map(g => this.dataManager.fixTaxonId(g.taxonid))))
    },
    rStrip: function () {
      return this.strips.filter(s => s.genome === this.rGenome)[0]
    },
    includeParalogs: {
      get: function () {
        return config.MGV.includeParalogs
      },
      set: function (v) {
        config.MGV.includeParalogs = Boolean(v)
      }
    }
  },
  watch: {
    vTaxons: function () {
      this.$root.$emit('taxons-changed')
    },
    vGenomes: function () {
      // if genomes change, force recalc of current list sets
      if (this.currentList) this.setCurrentList(this.currentList)
    }
  },
  methods: {
    /*
    DownloadImage    genomeView
    DownloadImage    zoomView
    ListOp           display
    ListOp           delete
    ListOp           edit
    ListOp           new
    DownloadSequence file      <totallength>
    DownloadSequence clipboard <totallength>
    DownloadSequence browser   <totallength>

    Navigate         zoom
    Navigate         scroll
    Navigate         etc...


    */
    logEvent: function (action, label, value) {
      ga.ga_logEvent("MGV", action, label, value)
    },
    // Toggle whether we are showing all feature labels or not.
    toggleShowAllLabels: function () {
      const cfg = config.ZoomRegion
      cfg.showFeatureLabels = !cfg.showFeatureLabels
    },
    toggleShowAllTranscripts: function () {
        config.ZoomRegion.showWhichTranscripts = (config.ZoomRegion.showWhichTranscripts + 1) % 3
    },
    toggleIncludeParalogs: function () {
      this.includeParalogs = !this.includeParalogs
      this.currentList && this.setCurrentList(this.currentList)
      this.$root.$emit('context-changed')
    },
    resize: function () {
      const sz = {width: u.wWidth(), height: u.wHeight()}
      this.visHeight = sz.height - 80
      this.$root.$emit('resize', sz)
    },
    initialize: function () {
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
        const ih = u.deepCopy(this.historyManager.initialHash)
        ih.width = u.wWidth()
        // console.log('MGV: setting initial context', ih)
        this.setContext(ih, true).then(() => {
            this.$root.$emit('mgv-initialized')
        })
      })
    },
    //
    // This routine is called at initialization time or when user hit Back or Forward button
    // Sets the viewer state according to cxt, which basically is a set of arguments parsed from URL #-part
    //
    setContext: function (cxt, quietly) {
      //
      this.scrollLock =
        cxt.locked === "on" ? true :
        cxt.locked === "off" ? false : this.scrollLock
      //
      this.includeParalogs =   
        cxt.includeParalogs === "on" ? true :
        cxt.includeParalogs === "off" ? false : this.includeParalogs
      //
      if (cxt.style) {
          this.$refs.settings.setContextFromString(cxt.style)
      }
      //
      if (cxt.ref) {
        // make sure ref is included in genomes list
        if (!cxt.genomes) {
          cxt.genomes = [cxt.ref]
        } else if (cxt.genomes.indexOf(cxt.ref) === -1) {
          cxt.genomes.push(cxt.ref)
        }
        //
        const rg = this.agIndex[cxt.ref]
        if (rg) {
          this.rGenome = rg
          this.scrollLock = false
        }
      } else {
        this.rGenome = null
      }
      // 
      let genomes = [this.allGenomes[0]]
      if (cxt.genomes) {
        genomes = cxt.genomes.map(n => this.agIndex[n]).filter(x => x)
      }
      //
      let p
      if (this.rGenome && !cxt.landmark && !cxt.strips) {
        p = this.dataManager.ensureFeatures(this.rGenome).then(() => {
            if (!cxt.chr) {
                // if no coordinates specified, insert default. First megabase of the first chr
                cxt.chr = this.rGenome.chromosomes[0].name
                cxt.start = this.rGenome.chromosomes[0].minStart
                cxt.end = cxt.start + 1000000
            }
            const c = this.rGenome.chromosomes.filter(chr => chr.name === cxt.chr)[0]
            const coords = {
              chr: c,
              start: cxt.start,
              end: cxt.end
            }
            return this.regionManager.initMappedRegions(this.rGenome, coords, genomes)
        })
      } else if (cxt.landmark) {
        const lcoords = {
           landmark: cxt.landmark,
           lgenome: genomes[0],
           delta: cxt.delta || 0
        }
        if (typeof(cxt.flank) === 'number') {
          lcoords.flank = cxt.flank
          lcoords.flankIsMultiplier = cxt.flankIsMultiplier
        } else {
           lcoords.length = cxt.length || 1000000
        }
        p = this.regionManager.alignOnLandmark(lcoords, genomes)
      } else if (cxt.strips) {
        // Map regions specs to specs with genome and chromosome names resolved to objects.
        const strips = cxt.strips.map(s => {
          const g = this.agIndex[s.genome]
          if (!g) return null
          return {
            genome: g,
            regions: s.regions.map(r => {
              return {
                genome: g,
                chr: g.chromosomes.filter(c => c.name === r.chr)[0],
                start: r.start,
                end: r.end,
                reversed: r.reversed,
                length: r.end - r.start + 1,
                width: r.width || r.end - r.start + 1
              }
            }).filter(r => r.chr)
          }
        }).filter(x => x)
        p = this.regionManager.initializeRegions(strips) 
      }
      // Set current selection from highlight ids
      return p.then(() => {
        //
        this.clearCurrentSelection()
        // resolve current selection IDs to features
        const prs = this.vGenomes.map(g => {
          return this.dataManager.ensureFeatures(g).then(() => {
            (cxt.currentSelection || []).forEach(ident => {
              this.dataManager.getFeaturesBy(ident).filter(f => f.genome === g).forEach(f => {
                if (!f.curie || !this.currentSelectionSet.has(f.curie)) {
                  this.addToCurrentSelection(f)
                }
              })
            })
          })
        })
        return Promise.all(prs).then(() => {
            // make sure the genome order matches the order specified in the URL
            this.$nextTick(() => {
                this.$refs.zoomView.$refs.main.setYs('model')
                // force a recalculation of selected sets
                window.setTimeout( () => this.currentSelection.splice(0,0), 1000)
            })
            if (!quietly) this.$root.$emit('context-changed')
        })
      })
    },
    getContextString: function () {
      let cs = this.regionManager.getParameterString()
      if (this.currentSelection && this.currentSelection.length) {
        const ids = Array.from(new Set(this.currentSelection.map(f => f.curie || f.ID)))
        cs += `&highlight=${ids}`
      }

      //
      if (this.rGenome) cs += '&ref=' + this.rGenome.name
      else if (this.scrollLock) cs += '&lock=on'
      //
      cs += '&paralogs=' + (this.includeParalogs ? 'on' : 'off')
      //
      cs += '&style=' + this.$refs.settings.getContextString()
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
      window.setTimeout(this.resize.bind(this), 500)
    },
    // FIXME All these handlers for features really belong somewhere else
    featureOver: function (f, t, e) {
      this.currentMouseover = f
      this.currentMouseoverT = t
      this.currentMouseoverE = e
    },
    featureOff: function () {
      this.currentMouseover = null
      this.currentMouseoverT = null
      this.currentMouseoverE = null
    },
    featureClick: function (f, t, e, ev, preserve) {
      // selection logic
      if (ev.shiftKey) {
        this.featureShiftClick(f, t, e)
      } else {
        if (e && e.dIndex !== undefined) {
            t = e.tExons.map(te => te.transcript)
            e = [].concat(e.tExons)
        }
        if (!preserve) {
            this.setCurrentSelection(f, t, e)
        } else {
            f.transcripts.forEach(t =>  this.removeFromCurrentSelection(null, t, t.exons))
            this.addToCurrentSelection(f, t, e)
        }
      }
      // align on gene
      if (ev.altKey) {
        this.$root.$emit('region-change', {
          op : 'feature-align',
          region: this.currRegion,
          features: this.currentSelection,
          event: ev,
          //basePos: this.clientXtoBase(e.clientX)
        })
      }
      this.$root.$emit('selection-state-changed')
      this.$root.$emit('context-changed')
    },
    featureShiftClick: function (f, t, e) {
        if (e) {
            if (e.tExons) {
                // shift-clicked on a distinct exon in graph-stype gene view.
                // If any of its tExons is currently selected, remove them all
                // If none are currently selected, add them all
                const someSelected = e.tExons.reduce((v,te) => v || this.csSetE.has(te), false)
                if (someSelected) {
                    e.tExons.forEach(te => {
                        this.removeFromCurrentSelection(null, null, te)
                        if (this.currentSelectionE.filter(ee => ee.transcript === te.transcript).length === 0) {
                            this.removeFromCurrentSelection(null, te.transcript)
                        }
                    })
                } else {
                    const ts = e.tExons.map(te => te.transcript)
                    this.addToCurrentSelection(null, ts, e.tExons)
                }
            } else if (this.csSetE.has(e)) {
                // remove e from current selection
                this.removeFromCurrentSelection(null, null, e)
                // if no other exons still selected t, remove t
                if (this.currentSelectionE.filter(ee => ee.transcript === t).length === 0) {
                    this.removeFromCurrentSelection(null, t, null)
                }
            } else {
                this.addToCurrentSelection(f, t, e)
            }
        } else if (t) {
            u.arrayify(t).forEach(tt => {
                if (this.csSetT.has(tt)) {
                    this.removeFromCurrentSelection(null, tt, null)
                    tt.exons.forEach(te => this.removeFromCurrentSelection(null, null, te))
                } else {
                    this.addToCurrentSelection(f, tt, null)
                }
            })
        } else if (this.csSet.has(f)) {
            this.removeFromCurrentSelection(f, null, null)
            f.transcripts.forEach(tt => {
                tt.exons.forEach(ee => this.removeFromCurrentSelection(null, null, ee))
                this.removeFromCurrentSelection(null, tt, null)
            })
        } else {
            this.addToCurrentSelection(f, null, null)
        }
    },
    //
    // Current selection methods
    //
    verifyCurrentSelection: function (quietly) {
      if (this.currentSelection.length === 0) {
          !quietly && alert("Nothing selected. Click on a feature to select it. Shift-click to select multiple.")
          return false
      }
      return true
    },
    setCurrentSelection: function (f, t, e) {
        this.currentSelection  = [].concat(u.arrayify(f))
        this.currentSelectionT = [].concat(u.arrayify(t))
        this.currentSelectionE = [].concat(u.arrayify(e))
    },
    addToCurrentSelection: function (f, t, e) {
        u.arrayify(f).forEach(ff => {
            this.currentSelection.indexOf(ff)  === -1 && this.currentSelection.push(ff)
        })
        u.arrayify(t).forEach(tt => {
            this.currentSelectionT.indexOf(tt)  === -1 && this.currentSelectionT.push(tt)
        })
        u.arrayify(e).forEach(ee => {
            this.currentSelectionE.indexOf(ee)  === -1 && this.currentSelectionE.push(ee)
        })
    },
    removeFromCurrentSelection: function (f, t, e) {
        const _remove = (elt, lst) => {
            const i = lst.indexOf(elt)
            if (i >= 0) lst.splice(i, 1)
            return i
        }
        u.arrayify(f).forEach(ff => _remove(ff, this.currentSelection))
        u.arrayify(t).forEach(tt => _remove(tt, this.currentSelectionT))
        u.arrayify(e).forEach(ee => _remove(ee, this.currentSelectionE))
    },
    clearCurrentSelection: function (gene){
        if (!gene) {
            this.currentSelection = []
            this.currentSelectionT = []
            this.currentSelectionE = []
        } else {
            gene.transcripts.forEach(t => {
                this.removeFromCurrentSelection(null, t, t.exons)
            })
        }
    },
    //
    // Current list methods
    //
    setCurrentList: function (lst) {
      this.currentList = lst
      const listFeats = u.flatten(lst.items.map(id => this.dataManager.getHomologs(id)))
      const idents = listFeats.map(f => f.curie).filter(x=>x)
      // this list includes homologs
      this.currentListSet = new Set(idents)
      // this one doesn't
      this.currentListSetStrict = new Set(lst.items)
      this.currentListItem = 0
    },
    stepCurrentList: function () {
      this.currentListItem = (this.currentListItem + 1) % this.currentList.items.length
    },
    clearCurrentList: function () {
      this.currentList = null
      this.currentListSet = null
      this.currentListItem = 0
    },
    //
    // Key bindings
    //
    initKeyBindings () {
      // Align
      this.keyManager.register({
       key: 'a',
       handler: () => {
         this.verifyCurrentSelection() && this.$root.$emit('region-change', { 'op' : 'feature-align' })
       },
       thisObj: this
      })
      // Show/hide Labels
      this.keyManager.register({
       key: 'n',
       handler: () => {
         this.toggleShowAllLabels()
       },
       thisObj: this
      })
      // Create  list from selection
      this.keyManager.register({
       key: 's',
       handler: e => this.verifyCurrentSelection() && this.$root.$emit('list-edit-newfromselected', {includeHomologs:e.shiftKey}),
       thisObj: this
      })
      // Expand/collapse
      this.keyManager.register({
       key: 'x',
       handler: () => this.toggleShowAllTranscripts(),
       thisObj: this
      })
      // Paralogs
      this.keyManager.register({
       key: 'p',
       handler: () => this.toggleIncludeParalogs(),
       thisObj: this
      })
      // Help
      this.keyManager.register({
       key: 'h',
       handler: () => this.$refs.helpBox.toggleOpen(),
       thisObj: this
      })
      // Tool drawer
      this.keyManager.register({
       key: 't',
       handler: () => this.toggleDrawer(),
       thisObj: this
      })
      // Scroll lock
      this.keyManager.register({
       key: 'l',
       handler: () => {
         this.$root.$emit('region-change', { op : this.scrollLock ? 'clear-lock-mode' : 'set-lock-mode'})
       },
       thisObj: this
      })
      // Cancel drag
      this.keyManager.register({
       key: 'Escape',
       handler: () => {
         this.$root.$emit('escape-pressed')
       },
       thisObj: this
      })
      // Ref genome
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
      // Zoom in
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
      // Zoom out
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
      // Scroll right
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
      // Scroll left
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
    this.$root.$on('clear-selection', d => {
      this.clearCurrentSelection(d)
      this.$root.$emit('selection-state-changed')
      this.$root.$emit('context-changed')
    })
    //
    this.app.$root.$on('region-current', r => { this.currRegion = r ? r.region : null })
    //
    this.$root.$on('feature-over', arg => this.featureOver(arg.feature, arg.transcript, arg.exon, arg.event))
    this.$root.$on('feature-out', () => this.featureOff())
    this.$root.$on('feature-click', arg => this.featureClick(arg.feature, arg.transcript, arg.exon, arg.event, arg.preserve))
    //
    this.$root.$on('list-click', data => {
      let lst = data.list || data
      let shift = data.event ? data.event.shiftKey : false
      if (lst.items.length === 0) {
          this.clearCurrentList()
          return
      }
      if (lst === this.currentList) {
        if (shift) {
          // shift-click repeatedly on a list to step through its members
          this.stepCurrentList()
        } else {
          this.clearCurrentList()
          this.$root.$emit('list-selection', null)
          return
        }
      } else {
        this.logEvent('ListOp', 'display')
        this.setCurrentList(lst)
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
        this.clearCurrentList()
      }
    })
    //
    this.$root.$on('list-edit-new', data => {
      if (data) {
        this.listManager.newList(data.name, data.items, data.color)
      } else {
        this.listManager.newList("New list")
        this.currentEditList = null
      }
    })
    //
    this.$root.$on('list-edit-newfromselected', d => {
      if (d && d.includeHomologs) {
        this.listManager.newList("selected", this.currentSelectionToListWithHoms)
      } else {
        this.listManager.newList("selected", this.currentSelectionToList)
      }
    })
    //
    this.$root.$on('list-edit-open', data => {
      this.currentEditList = data.list
      this.$refs.listEditor.open()
    })
    //
    this.$root.$on('list-edit-cancel', () => {
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
    // Here we go...
    this.initialize()
  }
})
</script>

<style>
:root {
    --main-bg-color: #e1e1e1;
    --main-banner-color: rgb(85, 127, 158);
}
html, body {
  height: 100%;
  margin: 0px;
  overflow: hidden;
}

/* scrollbar style not supported in FF  */
*::-webkit-scrollbar {
  width: 6px;
}
 
*::-webkit-scrollbar-thumb {
  background-color: darkgrey;
  border-radius: 3px;
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
  overflow-y: scroll; 
}
[name="rightColumn"] {
  overflow: scroll; 
}
[name="leftColumn"].open {
  min-width: 300px;
  max-width: 300px;
  opacity: 1;
}
[name="leftColumn"].closed {
  min-width: 0px;
  max-width: 0px;
  opacity: 0;
}

/* Class for making text unselectable.  See: 
   https://stackoverflow.com/questions/6900124/how-to-make-certain-text-not-selectable-with-css
*/
.unselectable-text {
    -webkit-user-select: none; /* Safari */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
    user-select: none; /* Standard */
}

/* Range slider styling. Lifted from https://www.cssportal.com/style-input-range/ */
input[type=range] {
  height: 16px;
  -webkit-appearance: none;
  width: 100%;
  background: none;
}
input[type=range]:focus {
  outline: none;
}
input[type=range]:disabled::-webkit-slider-thumb {
  background-color: rgb(197,197,197);
}
input[type=range]:disabled::-webkit-slider-runnable-track {
  border: 1px solid rgb(197,197,197);
}
input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 10px;
  background: none;
  border: 1px solid #000000;
  border-radius: 5px;
  cursor: pointer;
  animate: 0.2s;
}
input[type=range]::-webkit-slider-thumb {
  box-shadow: none;
  border: none;
  height: 8px;
  width: 8px;
  border-radius: 4px;
  background: #000000;
  cursor: pointer;
  -webkit-appearance: none;
  margin-top: 0px;
}
input[type=range]:focus::-webkit-slider-runnable-track {
  box-shadow: 0px 0px 8px #555555;
}
input[type=range]::-moz-range-track {
  width: 100%;
  height: 10px;
  cursor: pointer;
  animate: 0.2s;
  background: none;
  border-radius: 5px;
  border: 1px solid #000000;
}
input[type=range]:focus::-moz-range-track {
  box-shadow: 0px 0px 8px #555555;
}
input[type=range]::-moz-range-thumb {
  box-shadow: none;
  border: none;
  height: 8px;
  width: 8px;
  border-radius: 4px;
  background: #000000;
  cursor: pointer;
}
input[type=range]::-ms-track {
  width: 100%;
  height: 10px;
  cursor: pointer;
  animate: 0.2s;
  background: transparent;
  border-color: transparent;
  color: transparent;
}
input[type=range]::-ms-fill-lower {
  background: none;
  border: 1px solid #000000;
  border-radius: 5px;
  box-shadow: 0px 0px 6px #555555;
}
input[type=range]::-ms-fill-upper {
  background: none;
  border: 1px solid #000000;
  border-radius: 5px;
  box-shadow: 0px 0px 6px #555555;
}
input[type=range]::-ms-thumb {
  margin-top: 1px;
  box-shadow: none;
  border: none;
  height: 8px;
  width: 8px;
  border-radius: 4px;
  background: #000000;
  cursor: pointer;
}
input[type=range]:focus::-ms-fill-lower {
  background: none;
}
input[type=range]:focus::-ms-fill-upper {
  background: none;
}
/* checkbox styling. See: https://moderncss.dev/pure-css-custom-checkbox-style/  */
input[type="checkbox"] {
  appearance: none;
  background-color: var(--main-bg-color);
  margin: 0;
  font: inherit;
  color: currentColor;
  width: 1em;
  height: 1em;
  border: 0.15em solid currentColor;
  border-radius: 0.15em;
  transform: translateY(-0.075em);
  display: grid;
  place-content: center;
  cursor: pointer;
}
input[type="checkbox"]::before {
  content: "";
  width: 0.6em;
  height: 0.6em;
  transform: scale(0);
  transition: 120ms transform ease-in-out;
  box-shadow: inset 1em 1em black;
  transform-origin: bottom left;
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
}
input[type="checkbox"]:checked::before {
  transform: scale(1);
}

/* ********** */
/* ********** */
/* ********** */
</style>
