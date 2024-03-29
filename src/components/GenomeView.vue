/*
 * GenomeView.vue
 */
<template>
  <div class="flexcolumn">
    <div class="flexrow controls" >
      <!-- Genome selector -->
      <div>
        <select
          v-model="genome"
          >
          <option
            v-for="g in vGenomes"
            :key="g.name"
            :value="g"
            >{{g === context.rGenome ? '*' : ''}}{{g.name}}</option>
        </select>
      </div>
      <!-- -->
      <div
        class="flexrow" 
        style="justify-content: flex-start; flex-grow: unset;"
        >
        <!-- Open height control -->
        <input
          type="range"
          min="250"
          max="800"
          v-model="openHeight"
          v-show="isOpen"
          title="Height of GenomeView when open."
          />
        <!-- Scroll chromosome down button -->
        <m-button
          title="Scroll chromosomes down."
          icon="keyboard_arrow_down"
          @click="scrollChromosomes(-1)"
          v-show="!isOpen"
          />
        <!-- Scroll chromosome down button -->
        <m-button
          title="Scroll chromosomes up."
          icon="keyboard_arrow_up"
          @click="scrollChromosomes(+1)"
          v-show="!isOpen"
          />
        <!-- horiz/vert toggle -->
        <m-button
          :title="isOpen ?
            'Showing whole genome view. Click for single chromosome view.'
           :'Showing single chromosome view. Click for whole genome view.'"
          icon="dehaze"
          :class="isOpen ? 'rotate90' : ''"
          @click="isOpen = !isOpen"
          />
        <!-- Proportional/fixed toggle -->
        <m-button
          :title="fixedHeight ?
            'Showing chromosomes with fixed length. Click to show proportional.'
           :'Showing chromosomes with proportional lengths. Click to show fixed.'"
          :icon="fixedHeight ? 'dehaze' : 'sort'"
          @click="toggleHeight"
          class="rotate90"
          />
        <!-- Show list item labels on/off toggle -->
        <m-button
          :title="showLabels ? 'Showing list item labels. Click to hide.' : 'Hiding list item labels. Click to show.'"
          :icon="showLabels ? 'title' : 'format_strikethrough'"
          @click="showLabels = !showLabels"
          />
        <!-- Camera button -->
        <m-button
          title="Click to download PNG image. Shift-click to download SVG."
          @click="downloadImage"
          icon="camera_alt"
          />
      </div>
    </div>
    <!-- The view -->
    <svg
      class="genome-view"
      ref="svg"
      :height="isOpen ? height : closedHeight"
      style="font-family: sans-serif;"
      >
      <rect
        x=0
        y=0
        :width="width"
        :height="height"
        fill="#e1e1e1"
        />
      <g v-if="genome" :transform="`translate(0,${titleHeight})`">
        <genome-view-chromosome
           v-for="(c,i) in genome.chromosomes"
          :transform="transformChr(c,i)"
          :key="c.name"
          :genome="genome"
          :chromosome="c"
          :orientation="orientation"
          :height="chrLen(c)"
          :width="chrWidth"
          :glyphStyle="currentListHomologs.length >= 500 ? 'bigList' : 'smallList'"
          :currentSelection="app.csListH || []"
          currentSelectionColor="#ff0000"
          :currentList="currentListHomologsByChr[c.name] || []"
          :currentListIds="context.currentListSetStrict"
          :currentListColor="context.currentList ? context.currentList.color : 'gray'"
          :currRegion="context.currRegion"
          :showLabels="showLabels"
          :glyphRadius="5"
          @dragstart="dragstart"
          @dragend="dragend"
          :currMBrush="currMBrush"
          />
      </g>
    </svg>
    <!-- view footer -->
    <div class="flexrow" style="justify-content: space-between; min-height: 30px;">
      <div></div>
      <div class="flexcolumn" style="text-align: left;">
        <!-- current list -->
        <div>
          <span
            v-if="context.currentList"
            class="listGlyph"
            :style="{ backgroundColor: context.currentList.color, marginRight: '5px' }"
            />
          <span>{{currListTitle}}</span>
        </div>
        <div
          v-if="currentFacets.length > 0 && context.currentList"
          class="flexcolumn"
          >
          <span><i class="material-icons" style="font-size: 14px; color: #ff9800">warning</i> There are active filters. List may be truncated.</span>
          <span
            v-for="f in currentFacets"
            :key="f.facet"
            >{{formatFacet(f)}}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MComponent from './MComponent.js'
import GenomeViewChromosome from './GenomeViewChromosome.vue'
import MButton from './MButton.vue'
import { svg2png, svg2file } from '../lib/SvgDownload.js'
export default MComponent({
  name: 'GenomeView',
  components: { GenomeViewChromosome, MButton },
  props: [
    'context'
  ],
  inject: ['dataManager','getFacets'],
  data: function () {
    return {
      genome: null, // the genome to show
      currentListHomologs: [],
      currentListCount: 0,
      currentFacets: [],
      isOpen: true, // when open, shows all chrs (vertical); when closed, shows 1 chr (horiz).
      width: 600, // view width
      chrWidth: 20, // how wide to make each chr
      padding: 10,
      openHeight: 250, // view height when open
      closedHeight: 70, // view height when closed
      titleHeight: 30,
      scrollDelta: 0,
      fixedHeight: false, // if true, all chrs drawn same length; else, drawn proportional
      showLabels: true, // if true, show current list feature labels
      currMBrush: null, // while user is dragging a region tab, the MBrush component
      maxListLength: 5000 // max number of list items we'll draw
    }
  },
  computed: {
    vGenomes: function () {
      const vgs = this.app.vGenomes
      vgs.sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
      return vgs
    },
    currListTitle: function () {
      const clist = this.context.currentList
      if (!clist) return 'No current list.'
      const clen = clist.items.length 
      const ninlist = this.currentListCount
      const cglen = this.currentListHomologs.length - ninlist
      return `${clist.name} (List has: ${clen} ids. Genome has: ${ninlist} list members, ${cglen} homologs.)`
    },
    genomeName: function () {
      return this.genome ? this.genome.name : ''
    },
    currChr: function () {
      const cr = this.context.currRegion
      const cc = cr ? cr.chr : this.prevChr ? this.prevChr : (this.genome ? this.genome.chromosomes[0] : { name: '' })
      this.prevChr = cc
      return cc
    },
    currStart: function () {
      return this.context.coords.start
    },
    currEnd: function () {
      return this.context.coords.end
    },
    height: function () {
      return this.isOpen ? this.openHeight : this.closedHeight
    },
    orientation: function () {
      return this.isOpen ? 'v' : 'h'
    },
    maxChrLen: function () {
      return Math.max.apply(null, this.genome.chromosomes.map(c => c.length))
    },
    innerHeight: function () {
      return this.height - this.titleHeight - this.padding
    },
    innerWidth: function () {
      return this.width - 5 * this.padding
    },
    // pixels per base
    ppb: function () {
      return (this.isOpen ? this.innerHeight : this.innerWidth) / this.maxChrLen
    }
  },
  methods: {
    dragstart: function (d) {
      this.currMBrush = d.vm
    },
    dragend: function () {
      this.currMBrush = null
    },
    downloadImage: function (e) {
      if (e.shiftKey) {
        svg2file(this.$refs.svg, 'mgv.genomeview.svg')
      } else {
        svg2png(this.$refs.svg, this.width, this.height, 'mgv.genomeview.png')
      }
      this.app.logEvent('DownloadImage', 'genomeView')
    },
    // Returns the length in pixels to draw chromosome c
    chrLen: function (c) {
      let l = this.isOpen ? this.innerHeight : this.innerWidth
      return l * (this.fixedHeight ? 1 : c.length / this.maxChrLen)
    },
    resize: function () {
      this.width = this.$el.getBoundingClientRect().width
    },
    scrollChromosomes (inc) {
      let v = this.scrollDelta + inc
      let currI = this.genome.chromosomes.indexOf(this.currChr)
      this.scrollDelta = Math.max(-currI, Math.min(v, this.genome.chromosomes.length - currI - 1))
    },
    transformChr: function (c, i) {
      if (this.orientation === 'v') {
        let dx = (this.width - 2 * this.padding) / this.genome.chromosomes.length
        return `translate(${this.padding + (i + 0.5) * dx},0)`
      } else {
        let currI = this.genome.chromosomes.indexOf(this.currChr)
        let dy = (currI - i + this.scrollDelta) * this.chrWidth * 5
        return `translate(${this.padding},${dy})`
      }
    },
    toggleHeight: function () {
      this.fixedHeight = !this.fixedHeight
    },
    computeCurrentListHomologs () {
      if (!this.context.currentList) {
        this.currentListHomologs = []
        this.currentListHomologsByChr = {}
      } else {
        this.dataManager().ensureFeatures(this.genome).then(() => {
          const seen = new Set()
          this.currentListHomologs = this.context.currentList.items.map(id => {
                return this.dataManager().getHomologs(id, [this.genome])
              }).reduce((a,v) => a.concat(v), []).filter(x => {
                if (!x) return false
                if (seen.has(x.ID)) return false
                seen.add(x.ID)
                return this.getFacets().test(x)
              })
          const ss = this.context.currentListSetStrict
          this.currentListCount = this.currentListHomologs.map(h => (ss.has(h.curie) || ss.has(h.ID) ? 1 : 0)).reduce((a,v) => a+v, 0)
          this.currentListHomologsByChr = this.currentListHomologs.slice(0, this.maxListLegth).reduce((a,g) => {
            const n = g.chr.name
            if (!a[n]) a[n] = []
            a[n].push(g)
            return a
          }, {})
        })
      }
    },
    formatFacet (f) {
      return `${f.facet} [${f.values}]`
    }
  },
  watch: {
    genomeName: function () {
      this.resize()
    },
    isOpen: function () {
      this.scrollDelta = 0
    },
    genome: function () {
      this.computeCurrentListHomologs()
    }
  },
  mounted: function () {
    this.$root.ebus.on('resize', () => this.resize())
    this.$parent.$parent.ebus.on('pagebox-open', () => this.nextTick(() => this.resize()))
    this.nextTick(() => { this.resize() })
    this.$root.ebus.on('set-genomes', d=> {
      if (d.rGenome) {
        this.genome = this.app.dataManager.lookupGenome(d.rGenome)
      } else if (d.vGenomes.indexOf(this.genome.name) === -1) {
        this.genome = this.app.dataManager.lookupGenome(d.vGenomes[0])
      }
    })
    this.$root.ebus.on('facet-state', facets => {
      this.currentFacets = facets
      this.computeCurrentListHomologs()
    })
    this.$watch('context.currRegion', () => {
      this.scrollDelta = 0
      },
      { deep: true })
    this.$watch('vGenomes', () => {
      if (this.vGenomes.indexOf(this.genome) === -1) {
        this.genome = this.vGenomes[0]
      }
    })
    this.$watch('context.rGenome', () => {
      this.genome = this.context.rGenome || this.genome
    })
    this.$watch(
      'context.currentList',
      () => this.computeCurrentListHomologs(),
      { deep: true })
    this.$root.ebus.on('region-current', d => {
      if (d) {
        this.genome = d.region.genome
      }
    })
    this.$root.ebus.on('region-change', d => {
      const r = d.region
      if (r && r.genome) this.genome = r.genome
    })
  }
})
</script>

<style scoped>
svg {
    width: 100%;
}
.controls {
    position: sticky;
    top: 20px;
    background-color: var(--main-bg-color);
}
.rotate90 {
  transform: rotate(90deg)scale(1,-1);
}
.listGlyph {
  width: 10px;
  height: 10px;
  border-radius: 5px;
  border: thin solid black;
  display: inline-block;
}
</style>
