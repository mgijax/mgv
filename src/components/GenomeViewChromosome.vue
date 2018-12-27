<template>
  <g class="genome-view-chromosome" >
    <g :transform="transform" >
      <text
        x=0
        y=-2
        stroke="none"
        fill="black"
        text-anchor="middle"
        :transform="labelTransform"
        >{{chromosome.name}}</text>
      <line
          x1=0
          y1=0
          x2=0
          :y2="chrLen"
          stroke="black"
          ></line>
      <rect
        :x="-width / 2"
        :width="width"
        :y="0"
        :height="chrLen"
        fill="white"
        fill-opacity=0.5
        stroke="none"
        />
      <g
        v-if="currentList"
          v-for="f in currentList"
          :key="f.ID"
        >
        <line
          v-if="f.chr === chromosome"
          :x1="(width/2 - 1) * (f.strand === '-' ? -1 : 1)"
          :y1="ppb * f.start"
          :x2="0"
          :y2="ppb * f.start"
          stroke="black"
          />
        <circle
          class="glyph"
          v-if="f.chr === chromosome"
          :cx="(width/2 + 3) * (f.strand === '-' ? -1 : 1)"
          :cy="ppb * f.start"
          r="5"
          stroke="black"
          :fill="currentListColor"
          @click="clickedGlyph(f)"
          >
          <title>{{ f.symbol || f.ID }}</title>
        </circle>
      </g>
      <m-brush
        :x="-width / 2"
        :y="0"
        :width="width"
        :height="chrLen"
        fill="blue"
        :range="[1, chromosome.length]"
        :tabRange="[coords.start, coords.end]"
        :current="chromosome === coords.chr"
        :orientation="orientation"
        @brush="brushed($event)"
        />
    </g>
  </g>
</template>

<script>
import MComponent from '@/components/MComponent'
import gc from '@/lib/GenomeCoordinates'
import MBrush from '@/components/MBrush'

export default MComponent({
  name: 'GenomeViewChromosome',
  components: { MBrush },
  props: [
    'genome',
    'chromosome',
    'orientation',
    'ppb',
    'font-size',
    'font-family',
    'font-color',
    'coords',
    'width',
    'currentList',
    'currentListColor'
  ],
  computed: {
    rstart: function () {
      return this.coords.start * this.ppb
    },
    rheight: function () {
      return (this.coords.end - this.coords.start + 1) * this.ppb
    },
    chrLen: function () {
      return this.chromosome.length * this.ppb
    },
    textAnchor: function () {
      return this.orientation === 'h' ? 'end' : 'middle'
    },
    transform: function () {
      if (this.orientation === 'v') return 'rotate(0)'
      return `rotate(-90)translate(0,10)`
    },
    labelTransform: function () {
      if (this.orientation === 'v') return 'rotate(0)'
      return `rotate(90)translate(-10,8)`
    }
  },
  methods: {
    brushed: function (coords) {
      let nc = gc.validate({
        chr: this.chromosome.name,
        start: coords[0],
        end: coords[1]
      }, this.genome, true)
      this.$root.$emit('context', nc)
    },
    clickedGlyph: function (f) {
      let id = f.cID || f.ID
      this.$root.$emit('context', { landmark: id, currentSelection: [id] })
    }
  }
})
</script>

<style scoped>
.glyph {
  cursor: pointer;
}
</style>
