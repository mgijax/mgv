<template>
  <g class="range-boxes">
    <g
      v-for="(b, i) in boxes"
      :key="i"
      :transform="`translate(${b.scrollDelta},0)`"
      >
      <line
        v-if="b.x1 !== undefined"
        :x1="b.x1"
        :x2="b.x2"
        :y1="b.y1"
        :y2="b.y2"
        stroke="black"
        />
      <rect
        v-if="b.width !== undefined"
        :x="b.x"
        :y="b.y"
        :width="b.width"
        :height="b.height"
        fill="black"
        fill-opacity="0.4"
        />
      <rect
        :x="textRectX(b)"
        :y="textRectY(b)"
        :height="fontSize"
        :width="textRectWidth(b)"
        fill="white"
        />
      <text
        :x="textX(b)"
        :y="textY(b)"
        :text-anchor="textAnchor(b)"
        fill="black"
        :font-size="fontSize"
        font-family="sans-serif"
        >{{b.label}}</text>
    </g>
  </g>
</template>

<script>
import MComponent from '@/components/MComponent'
export default MComponent({
  name: 'RangeBoxes',
  props: [
  ],
  data: function () {
    return {
      fontSize: 10,
      boxes: []
    }
  },
  methods: {
    textX: function (b) {
      return b.x !== undefined ? (b.x + b.width / 2) : b.x1
    },
    textY: function (b) {
      return (b.y !== undefined ? b.y + b.height : b.y2) + this.fontSize
    },
    textAnchor: function (b) {
      return "middle"
    },
    textRectX: function (b) { 
      return this.textX(b) - (b.label.indexOf("..") === -1 ? 30 : 55)
    },
    textRectY: function (b) {
      return this.textY(b) - this.fontSize + 2
    },
    textRectWidth: function (b) {
      return b.label.indexOf("..") === -1 ? 60 : 110
    },
    getRegionVms: function (vm) {
      if (!vm || this.app.scrollLock) {
        const regionElts = this.$parent.$el.querySelectorAll('.zoom-region')
        return Array.from(regionElts).map(r => r.__vue__)
      } else {
        return [vm]
      }
    },
    getRegionElt: function (vm) {
      return vm.$el.querySelector('svg > g > rect.underlay')
    },
    drawLabels: function (regions, leftFrac, widthFrac) {
      const newlabels = []
      for (let i = 0; i < regions.length; i++) {
        const r = regions.item(i)
        newlabels.push(this.makeLabel(r, leftFrac, widthFrac))
      }
      this.labels = newlabels
    },
    makeLabel: function (rVm, leftFrac, widthFrac) {
      const rr = rVm.region
      const rLen = rr.end - rr.start + 1
      const s1 = Math.round(rr.start + leftFrac * rLen)
      const e1 = s1 + Math.round(widthFrac * rLen)
      if (s1 === e1) {
        return `${rr.chr.name}:${s1}`
      } else {
        return `${rr.chr.name}:${s1}..${e1}`
      }
    },
    drawLines: function (vms, leftFrac) {
      this.boxes = vms.map(vm => {
        return this.makeLine(vm, leftFrac)
      })
    },
    makeLine: function (vm, leftFrac) {
      // container's (ZoomMain) bounding box
      const pbb = this.$parent.$el.getBoundingClientRect()
      const bb = this.getRegionElt(vm).getBoundingClientRect()
      const x = Math.round(bb.left - pbb.left + (leftFrac * bb.width))
      const label = this.makeLabel(vm, leftFrac, 0)
      return {
        x1: x,
        y1: bb.top - pbb.top,
        x2: x,
        y2: bb.bottom - pbb.top,
        label: label,
        scrollDelta: 0
      }
    },
    drawRects: function (vms, leftFrac, widthFrac) {
      this.boxes = vms.map(vm => this.makeRect(vm, leftFrac, widthFrac))
    },
    makeRect: function (vm, leftFrac, widthFrac) {
      const rEl = this.getRegionElt(vm)
      const pbb = this.$parent.$el.getBoundingClientRect()
      const bb = rEl.getBoundingClientRect()
      const x = Math.round(bb.left - pbb.left + (leftFrac * bb.width))
      const label = this.makeLabel(vm, leftFrac, widthFrac)
      return {
        x: x,
        y: bb.top - pbb.top,
        width: widthFrac * bb.width,
        height: bb.height,
        label: label,
        scrollDelta: 0
      }
    }
  },
  mounted: function () {
    // mouseenter
    this.$root.$on('region-mouseenter', d => {
    })
    // mousemove
    this.$root.$on('region-mousemove', d => {
      // bounding box of the region that sent the event
      const bb = d.vm.$refs.underlay.getBoundingClientRect()
      // pix from left side of region
      const pxLeft = d.evt.clientX - bb.left
      // 
      this.drawLines(this.getRegionVms(d.vm), pxLeft / bb.width)
    })
    // mouseleave
    this.$root.$on('region-mouseleave', d => {
      this.boxes = []
    })
    // dragstart
    this.$root.$on('region-dragstart', d => {
      // console.log('dragstart', d)
      d.data.dragged = false
      d.data.bb = d.vm.$refs.underlay.getBoundingClientRect()
      d.data.shiftDrag = d.evt.shiftKey
      d.data.altDrag = d.evt.altKey
      d.data.metaDrag = d.evt.metaKey
      d.data.vms = this.getRegionVms(d.vm)
    })
    // drag
    this.$root.$on('region-drag', d => {
      // console.log('drag', d)
      d.data.dragged = true
      if (d.data.shiftDrag || d.data.altDrag || d.data.metaDrag) {
        let x1 = d.data.startX - d.data.bb.x
        let x2 = d.evt.clientX - d.data.bb.x
        const start = Math.min(x1, x2)
        const end = Math.max(x1, x2)
        const startp = start / d.data.bb.width
        const widthp = (end - start) / d.data.bb.width
        this.drawRects(d.data.vms, startp, widthp )
      } else {
        d.data.vms.forEach(vm => vm.regionScrollDelta = d.data.deltaX)
        this.boxes.forEach(b => {
          b.scrollDelta = d.data.deltaX
        })
      }
    })
    // dragend
    this.$root.$on('region-dragend', d => {
      //console.log('dragend', d)
      this.boxes = []
    })
  }
})
/*
        dragend: function (e, d) {
          if (!d.dragged || Math.abs(d.deltaX) < 3) {
            // this was actually just a click. If it was on the background, clear current selection
            if (!e.target.closest('.feature')) {
              this.$root.$emit('clear-selection')
            }
            this.dragData = null
            this.dragging = false
            this.regionScrollDelta = 0
            return
          }
          //
          const cr = this.currRange
          const crs = Math.min(cr[0], cr[1])
          const cre = Math.max(cr[0], cr[1])
          // Express the dragged region start and length as fractions relative to the whole region.
          // This allows easy conversion to the equiv part of other regions (for coordinated zooming).
          const pstart = crs / this.region.width
          const plength = (cre - crs + 1) / this.region.width
          //
          if (d.altDrag) {
            // selecting genomic sequence
            this.$root.$emit('sequence-selected', { sequences : [], unselectAll : true })
            this.$root.$emit('region-selected', {
              region: this.region,
              pstart: pstart,
              plength: plength,
              dragDirection: e.clientX > d.startX ? 'l-to-r' : 'r-to-l'
            })
          } else if (d.shiftDrag || d.metaDrag) {
            // zoom in/out of dragged region === composition of centered zoom plus a scroll
            this.$root.$emit('region-change', {
              region: this.region,
              op: 'zoomscroll',
              pstart: pstart,
              plength: plength,
              out: d.metaDrag // whether this is a zoom out (true) or zoom in (false)
            })
          } else {
            // scroll
            //const amt = this.deltaB / (this.region.end - this.region.start + 1)
            this.$root.$emit('region-change', { region: this.region, op: 'scroll', amt: this.myDelta })
          }
          
          //
          // A click event is fired (unavoidably) at mouseup. Here we set a flag for ourselves to ignore
          // the next click event (see method clicked() above).
          //
          this.absorbNextClick = true
          //
          this.regionScrollDelta = 0
          this.dragData = null
          this.dragging = false
          this.currRange = null
          this.$root.$emit('region-dragend', { region: this.region, vm: this })
        }
*/
</script>

<style scoped>
.range-boxes {
  pointer-events: none;
}
</style>
