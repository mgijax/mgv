<template>
  <svg
    class="zoom-main"
    :height="height"
    @click="clicked($event)"
    @wheel="wheeled"
    >
    <!-- underlay -->
    <rect
      x=0
      y=0
      :width="width"
      :height="height"
      fill="#e1e1e1"
      />
    <zoom-fiducials
      :height="height"
      ref="fiducials"
      />
    <zoom-strip
       v-for="zs in context.strips"
       ref="strips"
      :key="zs.genome.name"
      :strip="zs"
      :genome="zs.genome"
      :rGenome="context.rGenome"
      :context="context"
      :regions="zs.regions"
      :width="width"
      @height-changed="setYs()"
      @dragstart="zDragStart"
      @drag="zDrag"
      @dragend="zDragEnd"
      />
    <range-boxes 
      ref="rangeBoxes"
      />  
  </svg>
</template>

<script>
import MComponent from '@/components/MComponent'
import ZoomStrip from '@/components/ZoomStrip'
import ZoomFiducials from '@/components/ZoomFiducials'
import RangeBoxes from '@/components/RangeBoxes'
import { svg2png, svg2file } from '@/lib/SvgDownload'
import u from '@/lib/utils'
export default MComponent({
  name: 'ZoomMain',
  inject: ['regionManager'],
  props: ['context'],
  components: { ZoomStrip, ZoomFiducials, RangeBoxes },
  data: function () {
    return {
      width: 500,
      height: 200
    }
  },
  computed: {
    vgs: function () {
      return this.context.strips ? this.context.strips.map(s => s.genome.name).join(' ') : ''
    },
    rg: function () {
      return this.context.rGenome
    },
    stripGap: function () {
      return parseInt(this.cfg.stripGap)
    }
  },
  watch: {
    vgs: function () {
      this.$nextTick(() => { if (this.$refs.strips) this.setYs() })
    },
    rg: function () {
      if (this.$refs.strips) this.setYs()
    },
    stripGap: function () {
      if (this.$refs.strips) this.setYs()
    }
  },
  methods: {
    wheeled: function (e) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            return
        }
        e.stopPropagation()
        e.preventDefault()
    },
    clicked: function (e) {
      if (!e.shiftKey && e.target.classList.contains('underlay')) this.$root.$emit('clear-selection')
    },
    downloadImage: function (e) {
      if (e.shiftKey) {
        svg2file(this.$el, 'mgv.zoomview.svg')
      } else {
        svg2png(this.$el, this.width, this.height, 'mgv.zoomview.png')
      }
      this.app.logEvent("DownloadImage", "zoomView")
    },
    resize: function () {
      this.width = this.$el.parentNode.getBoundingClientRect().width - 5
      this.regionManager().layout()
    },
    // Returns the y coordinate of each zoom strip
    // Returns list of { strip: the strip vm, y: its y coordinate }
    // The list is sorted by ascending y.
    getYs () {
      const ys = this.$refs.strips.map(s => {
        return { strip: s, y: s.$el.getBoundingClientRect().y }
      })
      ys.sort((a, b) => a.y - b.y)
      return ys
    },
    // Returns the strip with the min Y coordinate
    getTopStrip: function () {
      return this.getYs()[0].strip
    },
    // Sets the y coordinate of each zoom strip while dragging.
    // Args:
    //  orderBy (string) One of: 'y', 'name', 'model'. Default is 'y'.
    //    y: Preserves current y order (but may shift things)
    //    name: orders by genome name
    //    model: orders by strips array in model
    // 
    setYs (orderBy) {
      let strips = this.getYs().map(y => y.strip)
      if (orderBy === 'y') {
        // pass
      } else if (orderBy === 'name') {
        u.sortBy(strips, s => s.genome.name)
      } else if (orderBy === 'model') {
        u.sortBy(strips, s => this.context.strips.indexOf(s.strip))
      }
      const rgi = strips.map(s => s.genome).indexOf(this.context.rGenome)
      if (orderBy !== 'y' && rgi > 0) {
        const s = strips.splice(rgi,1)[0]
        strips.splice(0,0,s)
      }
      let dy = 10
      strips.forEach((s,i) => {
        if(!s.dragging) s.zoomY = dy
        s.strip.order = i
        dy += s.height + this.stripGap
      })
      this.height = dy - this.stripGap + 40
    },
    // Handlers for dragging ZoomStrips to change their Y-order.
    zDragStart (d) {
      this.dragging = d
    },
    zDrag (d) {
      d.data.vm.dragY = d.data.deltaY
      this.setYs()
      this.$root.$emit('strip-move', d.vm)
    },
    zDragEnd (d) {
      d.data.vm.dragY = 0
      this.dragging = null
      this.setYs()
      this.$root.$emit('context-changed')
      this.$root.$emit('strip-move', d.vm)
    },
    sortStrips (sortBy) {
      this.setYs(sortBy)
      this.$root.$emit('context-changed')
    }
  },
  updated: function () {
    this.$root.$emit('zoom-main-updated')
  },
  created: function () {
    //
    this.$root.$on('resize', () => this.resize())
    this.nextTick(() => this.resize())
    this.$parent.$parent.$on('pagebox-open', () => this.nextTick(() => this.resize()))
    //
    this.$root.$on('region-change', d => {
      if (d.op === 'delete-strip') {
        window.setTimeout(() => this.setYs(), 250)
      }
    })
    //
    this.$root.$on('sort-strips', d => this.sortStrips(d))
  }
})
</script>

<style scoped>
</style>
