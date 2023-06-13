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
      <g v-if="glyphStyle === 'smallList'">
        <line
          v-for="g in myGlyphs"
          :key="g.f.ID"
          :name="g.f.ID"
          class="list-item noevents"
          :x1="g.gPoint[0]"
          :y1="g.gPoint[1]"
          :x2="g.aPoint[0]"
          :y2="g.aPoint[1]"
          stroke="black"
          />

        <g
          v-for="g in myGlyphs"
          :key="g.f.ID+'.2'"
          :name="g.f.ID"
          class="list-item"
          @click="clickedGlyph(g.f)"
          >
          <circle
            class="glyph"
            :cx="g.gPoint[0]"
            :cy="g.gPoint[1]"
            :r="glyphRadius"
            stroke="black"
            :fill="g.color"
            :stroke-opacity="g.inList ? 1 : 0"
            :fill-opacity="g.inList ? 1 : 0"
            >
          <title>{{ g.f.label }}</title>
          </circle>
          <text
            class="noevents"
            v-if="showLabels"
            :x="g.gPoint[0]"
            :y="g.gPoint[1] - glyphRadius"
            style="font-size: 10px; fill: black; text-anchor: middle;"
            >{{g.f.label}}</text>
        </g>
      </g>
      <g v-else>
        <line
          v-for="g in myGlyphs"
          :key="g.f.ID"
          :name="g.f.ID"
          class="list-item noevents"
          :x1="g.aPoint[0] + (g.f.strand === '-' ? -1 : 1) *  width / 2"
          :y1="g.aPoint[1]"
          :x2="g.aPoint[0]"
          :y2="g.aPoint[1]"
          :stroke="g.color"
          ><title>{{ g.f.label }}</title></line>
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
import MComponent from './MComponent.js'
import u from '../lib/utils.js'
import { SegmentLayout } from '../lib/Layout.js'
import MBrush from './MBrush.vue'

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
    'currentSelection',
    'currentSelectionColor',
    'currentList',
    'currentListIds',
    'currentListColor',
    'currRegion',
    'showLabels',
    'glyphRadius',
    'currMBrush', // if the user is currently dragging an MBrush
    'glyphStyle' // drawing style. 'smallList' or 'bigList'
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
      const csel = this.currentSelection.
              filter(f => f.chr === this.chromosome).
              map(f => [f, this.currentSelectionColor, true])
      const csIdSet = new Set(csel.map(fc => fc[0].curie || fc[0].ID))
      const clst = this.currentList.
              filter(f => ! csIdSet.has(f.curie || f.ID)).
              map(f => [f, this.currentListColor, true])
      return csel.concat(clst)
    },
    myGlyphs: function () {
      // glyphs. Each glyph == a feature + a center point for the glyph (circle) + an attachment point
      const gs = this.myList.map(fc => {
        const f = fc[0]
        const color = fc[1]
        const drawCirc = fc[2]
        return {
          f: f,
          color: color,
          inList: drawCirc,
          gPoint: [this.glyphX(f), this.glyphY(f)], // where glyph is centered
          aPoint: [0, this.glyphY(f)] // where connector line attaches to axis
        }
      })
      const gsByStrand = gs.reduce((a,g) => {
        a[g.f.strand || '+'].push(g)
        return a
      }, {'+':[], '-': [] })
      const th = this.showLabels ? 12 : 0 // text height
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
    brushleave: function () {
      this.$root.$emit('region-current', null)
    },
    brushed: function (data, rr) {
      if (!rr) return
      let c = rr.chr
      if (data.vm.capturedBy) {
        c = data.vm.capturedBy
        data.vm.capturedBy = null
      }
      // if not in unrestricted mode, make this the ref genome
      if (this.app.rGenome || this.app.scrollLock) {
        this.app.rGenome = this.genome
        this.app.scrollLock = false
      }
      this.$root.$emit('region-change', {
        op: 'set',
        region: rr,
        coords: {
          start: data.range[0],
          end: data.range[1],
          chr: c
        }
      })
    },
    clickedGlyph: function (f) {
      this.$root.$emit('region-change', { op : 'feature-align', feature: f })
    },
    glyphX: function (f) {
      return (this.width/2 + this.glyphRadius) * (f.strand === '-' ? -1 : 1)
    },
    glyphY: function (f) {
      return this.ppb * f.start
    },
    glyphTextX: function (f) {
      const dx = this.orientation === 'v' ? 0 : (f.strand === '-' ? -this.glyphRadius-10 : this.glyphRadius + 2)
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
        d.shiftDrag = e.shiftKey
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
          // user just clicked. Set the region size to a fraction of the chromosome's length
          const delta = Math.round((this.chromosome.length * .01) / 2)
          r.start -= delta
          r.end += delta
        }
        // if not in unrestricted mode, make this the ref genome
        if (this.app.rGenome || this.app.scrollLock) {
          this.app.rGenome = this.genome
          this.app.scrollLock = false
        }
        this.$root.$emit('region-change', { vm: this, op: 'new', region: r, only: !d.shiftDrag })
      }
    }, this.$parent.$el, this)
  }
})
</script>

<style scoped>
.list-item {
  cursor: pointer;
}
.noevents {
  pointer-events: none;
}
</style>
