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
      <!-- drag area when creating a new region -->
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
        v-for="g in myGlyphs"
        :key="g.f.ID"
        :name="g.f.ID"
        class="list-item"
        >
        <line
          :x1="g.gPoint[0]"
          :y1="g.gPoint[1]"
          :x2="g.aPoint[0]"
          :y2="g.aPoint[1]"
          stroke="black"
          />
        <circle
          class="glyph"
          :cx="g.gPoint[0]"
          :cy="g.gPoint[1]"
          :r="glyphRadius"
          stroke="black"
          :fill="currentListColor"
          @click="clickedGlyph(g.f)"
          >
          <title>{{ g.f.symbol || g.f.ID }}</title>
        </circle>
        <text
          v-if="showLabels"
          :x="g.gPoint[0]"
          :y="g.gPoint[1] - glyphRadius"
          :ransform="`translate(${glyphTextX(g.f)},${glyphTextY(g.f)})rotate(${orientation === 'h' ? 90 : 0})`"
          style="font-size: 10px; fill: black; text-anchor: middle;"
          >{{g.f.symbol || g.f.ID}}</text>
      </g>
      <m-brush
        v-for="(r, ri) in regions"
        :key="'region'+ri"
        :x="-width / 2"
        :y="0"
        :width="width"
        :height="chrLen"
        :fill="r === currRegion ? 'red' : 'blue'"
        :range="[1, chromosome.length]"
        :tabRange="[r.start, r.end]"
        :orientation="orientation"
        @brush="data => brushed(data, r)"
        @dragstart="data => $emit('dragstart', data)"
        @dragend="data => $emit('dragend', data)"
        @mouseenter="brushenter(r)"
        @mouseleave="brushleave(r)"
        />
    </g>
  </g>
</template>

<script>
import MComponent from '@/components/MComponent'
import gc from '@/lib/GenomeCoordinates'
import u from '@/lib/utils'
import { SegmentLayout } from '@/lib/Layout'
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
    'currRegion',
    'showLabels',
    'glyphRadius',
    'currMBrush' // if the user is currently dragging an MBrush
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
    },
    myList: function () {
      return (this.currentList.slice(0,250) || []).filter(f => f.chr === this.chromosome)
    },
    myGlyphs: function () {
      const gs = this.myList.map(f => {
        return {
          f: f,
          gPoint: [this.glyphX(f), this.glyphY(f)], // where glyph is centered
          aPoint: [0, this.glyphY(f)] // where connector line attaces to axis
        }
      })
      const gsByStrand = gs.reduce((a,g) => {
        a[g.f.strand].push(g)
        return a
      }, {'+':[], '-': [] })
      const th = this.showLabels ? 12 : 0
      for (let strand in gsByStrand) {
        const sgs = gsByStrand[strand]
        const segs = sgs.map(g => {
          return {
            start: g.gPoint[1],
            end: g.gPoint[1] + 2 * this.glyphRadius + th,
            g: g
          }
        })
        this.spreader.layout(segs)
        segs.forEach(s => {
          s.g.gPoint[1] = s.start
        })
      }
      return gs
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
    brushenter: function (r) {
      this.$root.$emit('region-current', { region : r })
    },
    brushleave: function (r) {
      this.$root.$emit('region-current', null)
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
      this.$root.$emit('feature-align', { feature: f })
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
    }
  },
  updated: function () {
    //this.spreadGlyphs()
  },
  created: function () {
    this.spreader = new SegmentLayout()
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
