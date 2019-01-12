<template>
  <svg
    class="zoom-main"
    :height="height"
    :width="width"
    @click="backgroundClick"
    >
    <zoom-fiducials
      :features="context.currentSelection"
      :currentMouseover="context.currentMouseover"
      :vGenomes="context.vGenomes"
      :height="height"
      ref="fiducials"
      />
    <zoom-strip
       v-for="g in context.vGenomes"
       ref="strips"
      :key="g.name"
      :genome="g"
      :context="context"
      :width="width"
      @height-changed="setYs"
      :transform="`translate(0,${g.zoomY + g.dragY})`"
      @dragstart="zDragStart"
      @drag="zDrag"
      @dragend="zDragEnd"
      :regionScrollDelta="regionScrollDelta"
      />
  </svg>
</template>

<script>
import MComponent from '@/components/MComponent'
import ZoomStrip from '@/components/ZoomStrip'
import ZoomFiducials from '@/components/ZoomFiducials'
import svg2png from '@/lib/Svg2Png'
export default MComponent({
  name: 'ZoomMain',
  props: ['context'],
  components: { ZoomStrip, ZoomFiducials },
  data: function () {
    return {
      width: 500,
      height: 200,
      regionScrollDelta: 0
    }
  },
  computed: {
    vgs: function () {
      return this.context.vGenomes.map(g => g.name).join(' ')
    }
  },
  watch: {
    vgs: function () {
      this.setYs()
    }
  },
  methods: {
    downloadImage: function () {
      svg2png(this.$el, this.width, this.height)
    },
    resize: function () {
      this.width = this.$el.parentNode.getBoundingClientRect().width
    },
    setYs () {
      let dy = 0
      this.context.vGenomes.forEach(vg => {
        vg.zoomY = dy
        dy += vg.height + 34
      })
      this.height = dy
    },
    getYs () {
      return this.$refs.strips.map(z => {
        return { strip: z, y: z.$el.getBoundingClientRect().y }
      })
    },
    // Handlers for dragging ZoomStrips to change their Y-order.
    zDragStart (d) {
      this.dragging = d
    },
    zDrag (d) {
      d.data.genome.dragY = d.data.deltaY
    },
    zDragEnd (d) {
      d.data.genome.dragY = 0
      this.dragging = null
      let ys = this.getYs()
      ys.sort((a, b) => a.y - b.y)
      let gs = ys.map(d => d.strip.genome.name)
      this.$root.$emit('context', { genomes: gs })
    },
    backgroundClick: function () {
      this.$root.$emit('context', { currentSelection: [] })
    }
  },
  mounted: function () {
    this.$root.$on('resize', () => this.resize())
    this.$root.$on('region-drag', d => {
      this.regionScrollDelta = d
    })
    this.$root.$on('region-dragend', d => {
      this.regionScrollDelta = 0
    })
    window.setTimeout(() => this.resize(), 1000)
    this.$root.$on('camera-click', () => this.downloadImage())
  }
})
</script>

<style scoped>
.zoom-main * {
  transition: transform 0.5s height 0.5s;
}
</style>
