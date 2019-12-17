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
        v-for="(p, i) in edges"
        :key="i"
        :points="points(p[0], p[1])"
        :fill="color(p[0], p[1])"
        :fill-opacity="cfg.fillOpacity"
        :stroke="color(p[0], p[1])"
        :stroke-opacity="cfg.fillOpacity"
        />
    </g>
    <g
      class="featureRects"
      :transform="`translate(${deltaX}, 0)`"
      >
      <rect
        v-for="(r,j) in clickedFeatures"
        :key="'rect_'+j"
        :x="r.x-2"
        :y="r.y-2"
        :width="r.width+4"
        :height="r.height+4"
        stroke="black"
        fill="none"
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
      clickedFeatures: [],
      edges: []
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
    //
    getGraphNodes () {
      const dm = this.dataManager()
      const inclParas = this.app.cfg.includeParalogs
      const pel = this.$parent.$el
      if (!pel) return []
      const clickedFeatures = []
      const boxesByStrip = []
      pel.querySelectorAll('.zoom-strip').forEach((zel, zi) => {
       const boxes = []
       boxesByStrip.push(boxes)
       zel.querySelectorAll('.zoom-region').forEach(rel => {
        const rev = rel.classList.contains('reversed')
        rel.querySelectorAll('.feature.highlight.visible').forEach(fel => {
          //
          if (fel.classList.contains('selected')) clickedFeatures.push(fel.getBoundingClientRect())
          //
          const fid = fel.getAttribute('name')
          const f = this.dataManager().getFeatureById(fid)
          //
	  const rect = fel.querySelector('.feature > rect').getBoundingClientRect()
	  rect.strand = fel.getAttribute('strand')
          if (rev) rect.strand = rect.strand === '+' ? '-' : '+'
          //
          // Each node has a feature, a rectangle, and a reachable set.
          boxes.push({fel: fel, rect:rect, feature:f, reachable: (new Set())})
        })
       })
      })
      // Remove empty lists then sort by strip y-position.
      const boxesByStrip2 = boxesByStrip.filter(x => x.length > 0)
      boxesByStrip2.sort((a,b) => a[0].rect.y - b[0].rect.y)
      this.clickedFeatures = clickedFeatures
      return boxesByStrip2
    },
    //
    buildGraph () {
      //
      if (!this.cfg.showConnectors) {
        this.nodes = []
        this.edges = []
        return
      }
      //
      const dm = this.app.dataManager
      const nstrips = this.getGraphNodes()
      const edges = []
      const addEdges = (n,i) => {
        if (i === 0) return
        const rest = nstrips.slice(0, i).reverse()
        rest.forEach(row => {
          row.forEach(m => {
            if (n.reachable.has(m)) return
            if (dm.equivalent(n.feature, m.feature)) {
              edges.push([m.rect,n.rect])
              n.reachable.add(m)
              m.reachable.forEach(r => n.reachable.add(r))
            }
          })
        })
      }
      //
      nstrips.forEach((nstrip, i) => {
        nstrip.forEach(node => {
          addEdges(node, i)
        })
      })
      this.nodes = nstrips
      this.edges = edges
    }
  },
  mounted: function () {
    this.$root.$on('region-update', () => this.buildGraph())
  }
})
</script>

<style scoped>
</style>
