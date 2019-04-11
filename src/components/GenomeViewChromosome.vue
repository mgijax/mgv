<template>
  <g
    class="genome-view-chromosome"
    @mouseenter="mouseenter"
    >
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
        ref="background"
        :x="-width / 2"
        :width="width"
        :y="0"
        :height="chrLen"
        fill="white"
        fill-opacity=0.5
        stroke="none"
        />
      <!-- curr drag region -->
      <rect
        v-if="dragging"
        ref="dragrect"
        name="dragrect"
        :x="-width / 2"
        :width="width"
        :y="dragRectY"
        :height="dragRectHeight"
        fill="red"
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
        v-for="(r, ri) in regions"
        :key="'region'+ri"
        :x="-width / 2"
        :y="0"
        :width="width"
        :height="chrLen"
        fill="blue"
        :range="[1, chromosome.length]"
        :tabRange="[r.start, r.end]"
        :orientation="orientation"
        @brush="data => brushed(data, r)"
        @dragstart="data => $emit('dragstart', data)"
        @dragend="data => $emit('dragend', data)"
        />
    </g>
  </g>
</template>

<script>
import MComponent from '@/components/MComponent'
import gc from '@/lib/GenomeCoordinates'
import u from '@/lib/utils'
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
    'width',
    'currentList',
    'currentListColor',
    'showLabels',
    'glyphRadius',
    'currMBrush'
  ],
  data: function () {
    return {
      dragging: false,
      dragRectY: 0,
      dragRectHeight: 10
    }
  },
  computed: {
    regions: function () {
      return this.app.regionManager.getRegions(this.genome, this.chromosome)
    },
    ppb: function () {
      return this.height / this.chromosome.length
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
    mouseenter: function () {
      if (this.currMBrush) {
        // The user has dragged a region tab over this chromosome.
        // Capture it!
        this.$el.childNodes[0].append(this.currMBrush.$el)
        // This doesnt work...
        // this.currMBrush.range = [1, this.chromosome.length]
        this.currMBrush.capturedBy = this.chromosome
        this.currMBrush.maxLength = this.chromosome.length
      }
    },
    brushed: function (data, rr) {
      if (!rr) return
      rr.start = data.range[0]
      rr.end = data.range[1]
      if (data.vm.capturedBy) {
        rr.chr = data.vm.capturedBy
        data.vm.capturedBy = null
      }
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
    },
    clientXYtoBase: function (e) {
      const bcr = this.$refs.background.getBoundingClientRect()
      const px = this.orientation === 'v' ? e.clientY - bcr.top : e.clientX - bcr.left
      const b = Math.floor(px / this.ppb)
      return b
    },
  },
  mounted: function () {
    const self = this
    const convert = function (e, d) {
      return self.orientation === 'v' ? e.clientY - d.bcr.top : e.clientX - d.bcr.left
    }
    // User can drag on chromosome to create a new region to view
    u.dragify(this.$refs.background, {
      dragstart: function (e, d) {
        // on drag start, init the start/end pix coords of the drag (p1, p2).
        // these will be used to compute the rect height and y-coord.
        d.bcr = e.target.getBoundingClientRect()
        d.p1 = convert(e, d)
        d.p2 = d.p1
        this.dragRectY = d.p1
        this.dragRectHeight = 1
        this.dragging = true
      },
      drag: function (e, d) {
        d.p2 = Math.min(this.chrLen, Math.max(0, convert(e, d)))
        this.dragRectY = Math.min(d.p1, d.p2)
        this.dragRectHeight = Math.abs(d.p1 - d.p2) + 1
      },
      dragend: function (e, d) {
        this.dragging = false
        // on drag end, turn the dragged region into a coordinate region
        const r = {
          genome: this.genome,
          chr: this.chromosome,
          start: Math.floor(Math.min(d.p1, d.p2) / this.ppb),
          end: Math.floor(Math.max(d.p1, d.p2) / this.ppb)
        }
        if (d.p1 === d.p2) {
          // user just clicked. Set the region size to a minimum of 10 MB.
          r.start -= 5000000
          r.end += 5000000
        }
        this.$root.$emit('region-change', { vm: this, op: 'new', region: r })
        console.log(r)
      }
    }, this.$parent.$el, this)
  }
})
</script>

<style scoped>
.glyph {
  cursor: pointer;
}
.genome-view-chromosome *:not([name="dragrect"]) {
  transition: height 0.5s;
}
</style>
