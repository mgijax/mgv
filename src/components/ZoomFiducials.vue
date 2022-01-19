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
    <g
      v-for="(h,k) in messages"
      :key="'inv_'+k"
      >
          <g @click.stop="clicked(h)">
          <message-box
              v-if="cfg.showWarnings && h.invisHomologString.length > 0"
              :transform="`translate(${h.x},${h.y + (h.height - 13)/2 + 9})`"
              :width="300"
              :message="' Not visible: ' + h.invisHomologString"
              title="This genome contains off-screen homologs of visible highlighted features. Click to bring into view."
              style="cursor : pointer;"

              :message-size="12"
              message-color="black"
              message-background="rgb(200 200 200 / 43%)"
              message-border="none"
              icon="⚠"
              :icon-size="16"
              icon-color="rgb(52, 255, 154)"
              icon-background="black"
              icon-border="rgb(52, 255, 154)"
              />
          </g>
          <message-box
              v-if="cfg.showWarnings && h.missingString.length > 0"
              :transform="`translate(${h.x +  (h.invisHomologString.length ? 310 : 0)}, ${h.y + (h.height - 13)/2 + 9})`"
              :width="300"
              :message="' No homologs for: ' + h.missingString"
              title="This genome has no homologs for some highlighted genes."

              :message-size="12"
              message-color="black"
              message-background="rgb(200 200 200 / 43%)"
              message-border="none"

              icon="⚠"
              :icon-size="16"
              icon-color="yellow"
              icon-background="black"
              icon-border="yellow"
              />
    </g>
  </g>
</template>

<script>
import MComponent from '@/components/MComponent'
import MessageBox from '@/components/MessageBox'
import config from '@/config'
//import u from '@/lib/utils'
export default MComponent({
  name: 'ZoomFiducials',
  props: ['height', 'width'],
  components: {
      MessageBox
  },
  inject: ['dataManager'],
  data: function () {
    return {
      deltaX: 0,
      clickedFeatures: [], // list of features the user clicked on`
      edges: [], // edges to draw. List of (box1, box2) where box1 and box2 are the
                 // bounding boxes of the features to be joined
      messages: [] // list of off-screen features that are homologs of current visible highlighted features
    }
  },
  computed: {
    selectedColor () {
      return config.ZoomRegion.selectedFeature.stroke
    }
  },
  methods: {
    clicked (desc) {
        for (let f of desc.invisHomologs) {
            if (! this.app.csSet.has(f)) {
               this.app.addToCurrentSelection(f)
            }
        }
        this.$root.$emit('region-change', { op : 'feature-align', features: this.app.currentSelection })
    },
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
    clipBoxAtRegionBoundary (fel, rel) {
        const box = fel.getBoundingClientRect()
        const cbox = rel.__vue__.$refs.underlay.getBoundingClientRect()
        const x = Math.max(box.x, cbox.x)
        const y = Math.max(box.y, cbox.y)
        const right = Math.min(box.x + box.width, cbox.x + cbox.width)
        const bottom = Math.min(box.y + box.height, cbox.y + cbox.height)
        const width = right - x
        const height = bottom - y
        return { x, y, width, height }
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
      // For each genome / ZoomStrip
      pel.querySelectorAll('.zoom-strip').forEach(zel => {
        // Get the genome model object and get the reference bounding box for positioning warning messages
        const sgenome = this.dataManager().getGenomeByName(zel.getAttribute('name'))
        const sbox = zel.querySelector(':scope > text[name="label"]').getBoundingClientRect()
        sboxes.push({ rect: sbox, elt: zel, genome: sgenome })
        // Keep track of the bounding boxes of highlighted features, per genome
        const boxes = [] // list of feature bounding boxes
        boxesByStrip.push(boxes)
        // For each region within this strip
        zel.querySelectorAll('.zoom-region').forEach(rel => {
          //
          const rev = rel.classList.contains('reversed')
          // For each visible, highlighted feature in this region
          const feats = rel.querySelectorAll(fselector)
          feats.forEach(fel => {
            // get the feature model object and add to vhf set
            const fid = fel.getAttribute('name')
            const genome = fel.getAttribute('genome')
            const f = this.dataManager().getFeatureById({name:genome},fid)
            vhfs.add(f)
            //
            this.dataManager().getHomologs(f).forEach(h => {
                if (this.app.currentSelectionSet.has(h.curie)
                || this.app.currentMouseoverSet.has(h.curie)
                || this.app.currentListSet && this.app.currentListSet.has(h.curie)) allHoms.add(h)
            })
            // Keep track of which specific features to draw a box around (the ones actually clicked)
            if (fel.classList.contains('selected')) {
                const bb = this.clipBoxAtRegionBoundary(fel, rel)
                if (bb.height > 0 && bb.width > 0) {
                    clickedFeatures.push(bb)
                }
            }
            // Add descriptor for feature.
            const rect = this.clipBoxAtRegionBoundary(fel.querySelector('.feature > rect'), rel)
            rect.strand = fel.getAttribute('strand')
            if (rev) rect.strand = rect.strand === '+' ? '-' : '+'
            //
            // Add descriptor for this feature to the list for this strip
            boxes.push({fel: fel, rect:rect, feature:f, reachable: (new Set())})
            //
          }) // features
        }) // regions
      }) // strips

      // Remove empty lists then sort by strip y-position.
      const boxesByStrip2 = boxesByStrip.filter(x => x.length > 0)
      boxesByStrip2.sort((a,b) => a[0].rect.y - b[0].rect.y)
      this.clickedFeatures = clickedFeatures

      // find all highlightable features that are (a) not in the visible highlighted set and (b) are homologs to something that is
      const invis = Array.from(allHoms).filter(h => {
          if (vhfs.has(h)) return false
          for (let hh of this.dataManager().getHomologs(h)) {
              if (vhfs.has(hh)) return true
          }
          return false
      })

      // group by genome
      const invisGrouped = invis.reduce((m,f) => {
          if (! m[f.genome.name]) {
            m[f.genome.name] = new Set()
          }
          m[f.genome.name].add(f)
          return m
      }, {})

      // generate list of descriptors for drawing the warning messages.
      this.messages = sboxes.map(sb => {
        const invisHomologs =  Array.from(invisGrouped[sb.genome.name] || [])
        const invisHomologString = invisHomologs.map(f => f.label).sort().join(", ")
        const gmissing = Array.from(this.app.missingByGenome.get(sb.genome) || []).filter(f => {
            for (let hf of this.dataManager().getHomologs(f)) {
                if (vhfs.has(hf)) return true
            }
            return false
        })
        const missingString = Array.from(new Set(gmissing.map(f => f.label))).sort().join(", ")
        //
        return {
          x: sb.rect.x + sb.rect.width + 16,
          y: sb.rect.y,
          height: sb.rect.height,
          invisHomologString: invisHomologString,
          invisHomologs: invisHomologs,
          missingString: missingString
        }
      })
      //
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
      this.edges = edges
    }
  },
  mounted: function () {
    this.suspended = false
    this.timeout = null
    // 
    this.build2 = () => {
      if (this.suspended) return
      this.buildGraph()
      if (this.timeout) { window.clearTimeout(this.timeout) }
      this.timeout = window.setTimeout(() => {
          this.buildGraph()
          this.timeout = null
      }, 300)
    }
    this.rds = () => { // rds = region drag start
        if (! this.cfg.continuousUpdate) {
            this.messages = []
            this.edges = []
            this.clickedFeatures = []
            this.suspended = true
        }
    }
    this.rde = () => { // rde = region drag end
        if (! this.cfg.continuousUpdate) {
            this.suspended = false
            this.build2()
        }
    }
    this.$root.$on('region-update', this.build2)
    this.$root.$on('strip-move', this.build2)
    this.$root.$on('zoom-main-updated', this.build2)
    this.$root.$on('region-dragstart', this.rds)
    this.$root.$on('region-dragend', this.rde)
    this.$root.$on('strip-dragstart', this.rds)
    this.$root.$on('strip-dragend', this.rde)
  },
  destroyed: function () {
    this.$root.$off('region-update', this.build2)
    this.$root.$off('strip-move', this.build2)
    this.$root.$off('zoom-main-updated', this.build2)
    this.$root.$off('region-dragstart', this.rds)
    this.$root.$off('region-dragend', this.rde)
    this.$root.$off('strip-dragstart', this.rds)
    this.$root.$off('strip-dragend', this.rde)
  }
})
</script>

<style scoped>
</style>
