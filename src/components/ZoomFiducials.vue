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
        :y="r.y+2"
        :width="r.width+2"
        :height="r.height-1"
        :stroke="selectedColor"
        stroke-width="2"
        fill="none"
        />
    </g>
    <!-- invisible homologs -->
    <g
      v-for="(h,k) in invisHomologs"
      :key="'inv_'+k"
      >
        <g
          v-if="h.feats.length > 0"
          >
          <rect
            :x="h.x"
            :y="h.y"
            :width="12"
            :height="12"
            stroke="gray"
            stroke-width="1"
            fill="rgb(52, 255, 154)"
            ><title>This genome has invisible homologs: {{h.feats.join(",")}}</title></rect>
          <text 
            :x="h.x + 6"
            :y="h.y + 10"
            text-anchor="middle"
            style="font-size: 12px; font-weight: bold; font-family: sans-serif; pointer-events: none;"
            fill="red"
            >!</text>
        </g>
    </g>
  </g>
</template>

<script>
import MComponent from '@/components/MComponent'
import config from '@/config'
export default MComponent({
  name: 'ZoomFiducials',
  props: ['height'],
  inject: ['dataManager'],
  data: function () {
    return {
      deltaX: 0,
      clickedFeatures: [], // list of features the user clicked on`
      edges: [], // edges to draw. List of (box1, box2) where box1 and box2 are the
                 // bounding boxes of the features to be joined
      invisHomologs: [] // list of off-screen features that are homologs of current visible highlighted features
    }
  },
  computed: {
    selectedColor () {
      return config.ZoomRegion.selectedFeature.stroke
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
      const fselector = this.cfg.showAllConnectors ? '.feature.visible' : '.feature.highlight.visible'
      const clickedFeatures = [] // features the user actually clicked on
      const boxesByStrip = [] // list of lists of highlighted features with their bounding boxes
      const vhfs = new Set() // visible highlighted features
      const allHoms = new Set() // all homologs of vhfs
      const sboxes = [] // list of zoom strip bounding boxes
      pel.querySelectorAll('.zoom-strip').forEach(zel => {
       //
       const sgenome = this.dataManager().getGenomeByName(zel.getAttribute('name'))
       const sbox = zel.querySelector('.underlay').getBoundingClientRect()
       sboxes.push({ rect: sbox, elt: zel, genome: sgenome })
       //
       const boxes = [] // list of feature bounding boxes
       boxesByStrip.push(boxes)
       zel.querySelectorAll('.zoom-region').forEach(rel => {
        const rev = rel.classList.contains('reversed')
        const feats = rel.querySelectorAll(fselector)
        feats.forEach(fel => {
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
          //
          vhfs.add(f)
          this.dataManager().getHomologs(f).forEach(h => {
              allHoms.add(h)
          })
        }) // features
       }) // regions
      }) // strips

      // compute invisible homologs of vhfs, grouped by genome
      // Then emit the resulting Map
      const invis = Array.from(allHoms).filter(h => !vhfs.has(h))
      const invisGrouped = invis.reduce((m,f) => {
          if (! m[f.genome.name]) {
            m[f.genome.name] = new Set()
          }
          m[f.genome.name].add(f.symbol || f.cID || f.ID)
          return m
      }, {})
      this.invisHomologs = sboxes.map(sb => {
        return {
          x: sb.rect.x,
          y: sb.rect.y - 14,
          feats: Array.from(invisGrouped[sb.genome.name] || [])
        }
      })
      ////

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
