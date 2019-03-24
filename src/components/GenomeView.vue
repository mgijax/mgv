/*
 * GenomeView.vue
 */
<template>
  <div class="flexcolumn">
    <div class="flexrow" >
      <div>{{genomeName}}</div>
      <div
        class="flexrow" 
        style="justify-content: flex-start; flex-grow: unset;"
        >
        <m-button
          title="Scroll chromosomes down."
          icon="keyboard_arrow_down"
          @click="scrollChromosomes(-1)"
          v-show="!isOpen"
          />
        <m-button
          title="Scroll chromosomes up."
          icon="keyboard_arrow_up"
          @click="scrollChromosomes(+1)"
          v-show="!isOpen"
          />
        <m-button
          :title="fixedHeight ?
            'Showing chromosomes with fixed length. Click to show proportional.'
           :'Showing chromosomes with proportional lengths. Click to show fixed.'"
          icon="sort"
          @click="toggleHeight"
          class="rotate90"
          />
        <m-button
          :title="showLabels ? 'Hide labels' : 'Show labels'"
          icon="title"
          @click="showLabels = !showLabels"
          />
        <m-button
          title="Download image."
          @click="downloadImage"
          icon="camera_alt"
          />
      </div>
    </div>
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
      <g :transform="`translate(0,${titleHeight})`">
        <genome-view-chromosome
           v-for="(c,i) in context.rGenome.chromosomes"
          :transform="transformChr(c,i)"
          :key="c.name"
          :genome="context.rGenome"
          :chromosome="c"
          :orientation="orientation"
          :height="chrLen(c)"
          :coords="context.coords"
          :width="chrWidth"
          :currentList="currentListGenologs"
          :currentListColor="context.currentList ? context.currentList.color : 'gray'"
          :showLabels="showLabels"
          :glyphRadius="5"
          />
        </g>
    </svg>
    <div class="flexrow" style="justify-content: space-between;">
      <div>
        {{currChr.name}}:{{this.context.coords.start}}..{{this.context.coords.end}}
      </div>
      <div>
        <span v-if="context.currentList" class="listGlyph" :style="{ backgroundColor: context.currentList.color }"/>{{context.currentList ? ' ' + context.currentList.name : ''}}
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import MComponent from '@/components/MComponent'
import GenomeViewChromosome from '@/components/GenomeViewChromosome'
import MButton from '@/components/MButton'
import svg2png from '@/lib/Svg2Png'
export default MComponent({
  name: 'GenomeView',
  components: { GenomeViewChromosome, MButton },
  props: ['context'],
  data: function () {
    return {
      isOpen: true,
      width: 600,
      titleHeight: 50,
      chrWidth: 20,
      padding: 10,
      openHeight: 250,
      closedHeight: 100,
      scrollDelta: 0,
      fixedHeight: false,
      showLabels: true
    }
  },
  computed: {
    cString: function () {
      return `${this.genomeName}:${this.currChr.name}:${this.currStart}:${this.currEnd}`
    },
    genomeName: function () {
      return this.context.rGenome.name
    },
    currChr: function () {
      return this.context.coords.chr
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
      return Math.max.apply(null, this.context.rGenome.chromosomes.map(c => c.length))
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
    },
    // Returns the genologs from the current ref genome of the canonical IDs in the currently displayed list.
    currentListGenologs: function () {
      if (!this.context.currentList) return []
      return this.context.currentList.items.map(id => {
        return this.dataManager.getGenolog(id, this.context.rGenome)
      }).filter(x => x)
    }
  },
  methods: {
    downloadImage: function () {
      svg2png(this.$refs.svg, 'mgv.genomeview.png')
    },
    // Returns the length in pixels to draw chromosome c
    chrLen: function (c) {
      let l = this.isOpen ? this.innerHeight : this.innerWidth
      return l * (this.fixedHeight ? 1 : c.length / this.maxChrLen)
    },
    resize: function () {
      this.width = this.$el.getBoundingClientRect().width
      this.openHeight = this.cfg.openHeight
    },
    setDisplay: function (v) {
      this.isOpen = v
    },
    scrollChromosomes (inc) {
      let v = this.scrollDelta + inc
      let currI = this.context.rGenome.chromosomes.indexOf(this.currChr)
      this.scrollDelta = Math.max(-currI, Math.min(v, this.context.rGenome.chromosomes.length - currI - 1))
    },
    transformChr: function (c, i) {
      if (this.orientation === 'v') {
        let dx = (this.width - 2 * this.padding) / this.context.rGenome.chromosomes.length
        return `translate(${this.padding + (i + 0.5) * dx},0)`
      } else {
        let currI = this.context.rGenome.chromosomes.indexOf(this.currChr)
        let dy = (currI - i + this.scrollDelta) * this.chrWidth * 5
        return `translate(${this.padding},${dy})`
      }
    },
    toggleHeight: function () {
      this.fixedHeight = !this.fixedHeight
    }
  },
  watch: {
    genomeName: function (oldc, newc) {
      this.resize()
    },
    isOpen: function (v0, v1) {
      this.scrollDelta = 0
    },
    cString: function (v0, v1) {
      this.scrollDelta = 0
    }
  },
  mounted: function () {
    this.$root.$on('resize', () => this.resize())
    Vue.nextTick(() => {
      this.resize()
    })
    this.$root.$on('camera-click', (v) => v === 'genomeview' && this.downloadImage())
  }
})
</script>

<style scoped>
.genome-view-chromosome {
    -webkit-transition: transform 0.5s;
    -moz-transition: transform 0.5s;
    -o-transition: transform 0.5s;
    transition: transform 0.5s;
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
