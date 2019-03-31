<template>
  <g
    class="zoom-fiducials"
    :transform="translate()"
    >
  <g
    v-for="s in stacks"
    :key="s.cid"
    :name="s.cid"
    class="zoom-fstack"
    :transform="`translate(${deltaX}, 0)`"
    >
    <polygon
      class="fiducial"
      v-for="(p, i) in s.rects"
      :key="i"
      v-if="i > 0"
      :points="points(s.rects[i - 1].rect, s.rects[i].rect)"
      fill="black"
      fill-opacity="0.15"
      stroke="black"
      stroke-opacity="0.3"
      />
    </g>
  </g>
</template>

<script>
import MComponent from '@/components/MComponent'
import u from '@/lib/utils'
export default MComponent({
  name: 'ZoomFiducials',
  props: ['features', 'currentMouseover',  'currentMouseoverT', 'vGenomes', 'height'],
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
    points: function (r1, r2) {
      return `${r1.x},${r1.y + r1.height} ${r2.x},${r2.y} ${r2.x + r2.width},${r2.y} ${r1.x + r1.width},${r1.y + r1.height}`
    },
    // Returns highlighted feature DOM nodes, grouped by canonical id and sorted by y-position
    getStacks (features, vGenomes) {
      if (!this.$parent.$el) return []
      // all visible highlighted feature nodes
      let hnodes = []
      this.$parent.$el.querySelectorAll(`.feature.highlight`).forEach(n => {
        if (n.style.display !== 'none') hnodes.push(n)
      })
      // index: canonical id -> list of nodes
      let ix = {}
      hnodes.forEach(fn => {
        let cid = fn.getAttribute('canonical')
        if (cid) {
          if (cid in ix) {
            ix[cid].push(fn)
          } else {
            ix[cid] = [fn]
          }
        }
      })
      let stacks = []
      for (let fid in ix) {
        let rects = ix[fid].map(fn => {
          return { fn, rect: fn.querySelector('.feature > rect').getBoundingClientRect() }
        })
        rects.sort((a, b) => a.rect.y - b.rect.y)
        stacks.push({ cid: fid, rects })
      }
      return stacks
    }
  },
  mounted: function () {
    window.setInterval(() => { this.stacks = this.getStacks(), 500})
  }
})
</script>

<style scoped>
</style>
