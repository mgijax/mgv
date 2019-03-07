<template>
  <g class="genome-view-chromosome" >
    <g :transform="transform" >
      <!-- chromosome label -->
      <text
        x=0
        y=-2
        stroke="none"
        fill="black"
        text-anchor="middle"
        :transform="labelTransform"
        >{{chromosome.name}}</text>
      <!-- chromosome axis line -->
      <line
          x1=0
          y1=0
          x2=0
          :y2="chrLen"
          stroke="black"
          ></line>
      <!-- background -->
      <rect
        :x="-width / 2"
        :width="width"
        :y="0"
        :height="chrLen"
        fill="white"
        fill-opacity=0.5
        stroke="none"
        />
      <!-- Glyphs for current list items -->
      <g
        v-if="currentList"
          v-for="f in currentList"
          :key="f.ID"
        >
        <line
          v-if="f.chr === chromosome"
          :x1="glyphX(f) - (f.strand === '+' ? glyphRadius : -glyphRadius)"
          :y1="glyphY(f)"
          :x2="0"
          :y2="glyphY(f)"
          stroke="black"
          />
        <circle
          class="glyph"
          v-if="f.chr === chromosome"
          :cx="glyphX(f)"
          :cy="glyphY(f)"
          :r="glyphRadius"
          stroke="black"
          :fill="currentListColor"
          @click="clickedGlyph(f)"
          >
          <title>{{ f.symbol || f.ID }}</title>
        </circle>
        <text
          v-if="f.chr === chromosome && showLabels"
          :x="0"
          :y="0"
          :transform="`translate(${glyphTextX(f)},${glyphTextY(f)})rotate(${orientation === 'h' ? 90 : 0})`"
          style="font-size: 10px; fill: black; text-anchor: middle;"
          >{{f.symbol || f.ID}}</text>
      </g>
      <m-brush
        :x="-width / 2"
        :y="0"
        :width="width"
        :height="chrLen"
        fill="blue"
        :range="[1, chromosome.length]"
        :tabRange="[coords.start, coords.end]"
        :current="chromosome.name === coords.chr.name"
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
    'height',
    'font-size',
    'font-family',
    'font-color',
    'coords',
    'width',
    'currentList',
    'currentListColor',
    'showLabels',
    'glyphRadius'
  ],
  computed: {
    ppb: function () {
      return this.height / this.chromosome.length
    },
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
    },
    glyphX: function (f) {
      return (this.width/2 + this.glyphRadius) * (f.strand === '-' ? -1 : 1)
    },
    glyphY: function (f) {
      return this.ppb * f.start
    },
    glyphTextX: function (f) {
      const dx = this.orientation === 'v' ? 0 : (f.strand === '+' ? this.glyphRadius + 2 : -this.glyphRadius-10)
      return this.glyphX(f) + dx
    },
    glyphTextY: function (f) {
      return this.glyphY(f) - (this.orientation === 'h' ? 0 : this.glyphRadius)
    }
  }
})
</script>

<style scoped>
.glyph {
  cursor: pointer;
}
.genome-view-chromosome * {
  transition: height 0.5s;
}
</style>
