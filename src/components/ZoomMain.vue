<template>
  <svg
    class="zoom-main"
    :height="height"
    @click="backgroundClick"
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
      :features="context.currentSelection"
      :currentMouseover="context.currentMouseover"
      :currentMouseoverT="context.currentMouseoverT"
      :height="height"
      ref="fiducials"
      />
    <zoom-strip
       v-for="(zs,i) in context.strips"
       ref="strips"
      :key="zs.genome.name"
      :strip="zs"
      :genome="zs.genome"
      :rGenome="context.rGenome"
      :context="context"
      :regions="zs.regions"
      :synGenome="synGenome(i)"
      :width="width"
      @height-changed="setYs()"
      @dragstart="zDragStart"
      @drag="zDrag"
      @dragend="zDragEnd"
      />
  </svg>
</template>

<script>
import MComponent from '@/components/MComponent'
import ZoomStrip from '@/components/ZoomStrip'
import ZoomFiducials from '@/components/ZoomFiducials'
import { svg2png, svg2file } from '@/lib/SvgDownload'
import u from '@/lib/utils'
export default MComponent({
  name: 'ZoomMain',
  inject: ['regionManager'],
  props: ['context'],
  components: { ZoomStrip, ZoomFiducials },
  data: function () {
    return {
      width: 500,
      height: 200,
    }
  },
  computed: {
    vgs: function () {
      return this.context.strips ? this.context.strips.map(s => s.genome.name).join(' ') : ''
    }
  },
  watch: {
    vgs: function () {
      if (this.$refs.strips) this.setYs()
    }
  },
  methods: {
    synGenome: function (i) {
      return null
      //if (this.context.strips.length !== 2) return null
      //return this.context.strips[1-i].genome
    },
    downloadImage: function (e) {
      if (e.shiftKey) {
        svg2file(this.$el, 'mgv.zoomview.svg')
      } else {
        svg2png(this.$el, this.width, this.height, 'mgv.zoomview.png')
      }
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
      let dy = 0
      strips.forEach((s,i) => {
        if(!s.dragging) s.zoomY = dy
        s.strip.order = i
        dy += s.height + 34
      })
      this.height = dy
    },
    // Handlers for dragging ZoomStrips to change their Y-order.
    zDragStart (d) {
      this.dragging = d
    },
    zDrag (d) {
      d.data.vm.dragY = d.data.deltaY
      this.setYs()
    },
    zDragEnd (d) {
      d.data.vm.dragY = 0
      this.dragging = null
      this.setYs()
      this.$root.$emit('context-changed')
    },
    backgroundClick: function (e) {
      if (e.target.closest('.zoom-region')) {
        this.$root.$emit('clear-selection')
      }
    }
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
    this.$root.$on('sort-strips', (sortBy) => {
        this.setYs(sortBy)
        this.$root.$emit('context-changed')
    })
  }
})
</script>

<style scoped>
.zoom-main * {
}
</style>
