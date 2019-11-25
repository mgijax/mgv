<template>
  <g
    class="zoom-fiducials"
    :transform="translate()"
    >
  <g
    class="zoom-fstack"
    :transform="`translate(${deltaX}, 0)`"
    >
    <polygon
      class="fiducial"
      v-for="(p, i) in stacks"
      :key="i"
      :points="points(p[0], p[1])"
      :fill="color(p[0], p[1])"
      :fill-opacity="cfg.fillOpacity"
      :stroke="color(p[0], p[1])"
      :stroke-opacity="cfg.fillOpacity"
      />
    </g>
  </g>
</template>

<script>
import MComponent from '@/components/MComponent'
import u from '@/lib/utils'
export default MComponent({
  name: 'ZoomFiducials',
  props: ['height'],
  inject: ['dataManager'],
  data: function () {
    return {
      deltaX: 0,
      stacks: []
    }
  },
  methods: {
    translate () {
      if (!this.$parent.$el) return ''
      let pbb = this.$parent.$el.getBoundingClientRect()
      return `translate(${-pbb.x}, ${-pbb.y})`
    },
    color: function (r1, r2) {
      return (!this.cfg.showInversions || r1.strand === r2.strand) ? 'black' : 'red'
    },
    points: function (r1, r2) {
      const p1 = `${r1.x},${r1.y + r1.height}`
      const p2 = `${r2.x},${r2.y}`
      const p3 = `${r2.x + r2.width},${r2.y}`
      const p4 = `${r1.x + r1.width},${r1.y + r1.height}`
      if (r1.strand === r2.strand || !this.cfg.showInversions) {
	  return `${p1} ${p2} ${p3} ${p4}`
      } else {
	  return `${p1} ${p3} ${p2} ${p4}`
      }
    },
    getVisibleHighlighted () {
      const dm = this.dataManager()
      const pel = this.$parent.$el
      if (!pel) return []
      const feats = new Set()
      pel.querySelectorAll('.feature.highlight.visible').forEach((fel, fi) => {
        const fid = fel.getAttribute('name')
        const f = dm.getFeatureById(fid)
        feats.add(f)
      })
      return Array.from(feats)
    },
    getStacks () {
      if (!this.cfg.showConnectors) return []
      const dm = this.dataManager()
      const inclParas = this.app.cfg.includeParalogs
      const pel = this.$parent.$el
      if (!pel) return []
      //
      // Build list of lists of rectangles for all the visible highlighted features
      const boxesByStrip = []
      pel.querySelectorAll('.zoom-strip').forEach((zel, zi) => {
       const boxes = []
       boxesByStrip.push(boxes)
       zel.querySelectorAll('.zoom-region').forEach(rel => {
        const rev = rel.classList.contains('reversed')
        rel.querySelectorAll('.feature.highlight.visible').forEach(fel => {
          //
          const fid = fel.getAttribute('name')
          const f = this.dataManager().getFeatureById(fid)
          //
	  const rect = fel.querySelector('.feature > rect').getBoundingClientRect()
          rect.feature = f
	  rect.strand = fel.getAttribute('strand')
          if (rev) rect.strand = rect.strand === '+' ? '-' : '+'
          //
          boxes.push(rect)
        })
       })
      })
      // Remove empty lists then sort by strip y-position.
      const boxesByStrip2 = boxesByStrip.filter(x => x.length > 0)
      boxesByStrip2.sort((a,b) => a[0].y - b[0].y)
      //
      const pairs = []
      let carryOver = [] // when rect doesn't connect to next row, keep trying further rows
      boxesByStrip2.forEach((rects, i) => {
        if (i === 0) return
        const prevRects = boxesByStrip2[i - 1]
        carryOver = [] // when rect doesn't connect to next row, keep trying further rows
        prevRects.forEach(r1 => {
          let r1matched = false
          rects.forEach(r2 => {
            if (dm.equivalent(r1.feature, r2.feature)) {
              pairs.push([r1, r2])
              r1matched = true
            }
          })
          if (!r1matched) carryOver.push(r1)
        })
        // carry over the unconnected rects to the next row
        carryOver.forEach(r => rects.push(r))
      })
      //
      return pairs
    }
  },
  mounted: function () {
    window.setInterval(() => { this.stacks = this.getStacks(), 500})
  }
})
</script>

<style scoped>
</style>
