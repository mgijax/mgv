<template>
  <g
    class="zoom-fiducials"
    :transform="translate()"
    >
    <g
      class="zoom-fstack"
      :transform="`translate(${deltaX}, 0)`"
      v-show="cfg.showConnectors"
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
        :x="r.x-1"
        :y="r.y+3"
        :width="r.width+2"
        :height="r.height-2"
        stroke="black"
        opacity=0.6
        fill="none"
        />
    </g>
  </g>
</template>

<script>
import MComponent from '@/components/MComponent'
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
    inverted: function (r1, r2) {
      return this.cfg.showInversions && r1.strand !== r2.strand && r1.strand && r2.strand
    },
    color: function (r1, r2) {
      return this.inverted(r1, r2) ? 'red' : 'black'
    },
    points: function (r1, r2) {
      const p1 = `${r1.x},${r1.y + r1.height}`
      const p2 = `${r2.x},${r2.y}`
      const p3 = `${r2.x + r2.width},${r2.y}`
      const p4 = `${r1.x + r1.width},${r1.y + r1.height}`
      if (this.inverted(r1,r2)) {
          return `${p1} ${p3} ${p2} ${p4}`
      } else {
          return `${p1} ${p2} ${p3} ${p4}`
      }
    },
    //
    getGraphNodes () {
      const pel = this.$parent.$el
      if (!pel) return []
      const clickedFeatures = []
      const boxesByStrip = []
      pel.querySelectorAll('.zoom-strip').forEach(zel => {
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
    const build2 = () => {
      this.buildGraph()
      window.setTimeout(() => this.buildGraph(), 300)
    }
    this.$root.$on('region-update', build2)
    this.$root.$on('strip-move', build2)
    this.$root.$on('zoom-main-updated', build2)
  }
})
</script>

<style scoped>
</style>
