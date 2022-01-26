<template>
  <div class="gene-view flexcolumn" >
    <div class="flexrow" style="justify-content: flex-start;">
        <div class="flexrow" style="justify-content: flex-start;">
            <span class="small-label">Normal</span>
            <m-button
              :icon="showTranscriptGraphs ? 'toggle_on' : 'toggle_off'"
              :title="showTranscriptGraphs ? '' : ''"
              @click="showTranscriptGraphs = !showTranscriptGraphs"
              />
            <span class="small-label">Transcript graphs</span>
        </div>
        <div class="flexrow" style="justify-content: flex-start;">
            <span class="small-label">Fixed scale</span>
            <m-button
              :icon="useFixedScale ? 'toggle_off' : 'toggle_on'"
              :title="useFixedScale ? 'Using fixed scale. Click for proportional scale.' : 'Using proportional scale. Click for fixed scale.'"
              @click="useFixedScale = !useFixedScale"
              />
            <span class="small-label">Proportional</span>
        </div>
        <div>
            Exon thickness: <input type="range" min="1" max="24" v-model="exonHeightM" />
        </div>
        <div>
            Intron gap: <input type="range" min="1" max="100" v-model="intronGapM" />
        </div>
        <div>
            Vertical space: <input type="range" min="1" max="32" v-model="vertGapM" />
        </div>
    </div>
    <!-- Genes display area -->
    <div
      v-for="(g,i) in myGenes"
      :key="i"
      class="gene flexcolumn"
      >

      <span>{{g.genome.name}} :: {{g.symbol}}</span>

      <!-- Transcript graphs -->
      <div v-if="showTranscriptGraphs"
          class="exon-graph"
          :style="{ height: heights[i] + 'px'}"
          style="position:relative;">

          <!-- underlying canvas for drawing connectors -->
          <canvas
              :width="width"
              :height="heights[i]"
              :style="{
                  position: 'absolute',
                  top: '0px',
                  left: '0px'
                  }"
          />    
        <!-- Exons -->
        <div
          v-for="(e,jj) in g.composite.dExons"
          :key="i + '.**.' + jj"
          class="exon"
          :style="exonStyle(e, g.composite, g)"
          ><span class="exon-label">{{e.dIndex}}</span></div>  
      </div>

      <!-- Each transcript on its own line -->
      <div v-else style="position:relative;">
          <!-- underlying canvas for drawing connectors -->
          <canvas
              :width="width"
              :height="heights[i]"
              :style="{
                  position: 'absolute',
                  top: '0px',
                  left: '0px'
                  }"
          />    
        <!-- each transcript -->
        <div
          v-for="(t,j) in g.transcripts"
          :key="i + '.' + j"
          class="transcript"
          :style="{ height: (exonHeight + vertGap) + 'px' }"
          >
          <!-- exons -->
          <div
            v-for="(e,k) in t.exons"
            :key="i + '.' + j + '.' + k"
            class="exon"
            :style="exonStyle(e, t, g)"
            ><span class="exon-label">{{e.de.dIndex}}</span></div>
        </div>
      </div> <!-- v-if -->
    </div> <!-- v-for -->
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import { FeaturePacker } from '@/lib/Layout'
//import u from '@/lib/utils'
export default MComponent({
  name: 'GeneView',
  components: { MButton },
  props: ['genes'],
  inject: ['featureColorMap'],
  data: function () {
    return {
      myGenes: [].concat(this.genes),
      // width (in px) of drawing area
      width: 800,
      // height
      heights: this.genes.map(() => 100),
      // pixels per base
      ppb: 0.5,
      //
      vertGapM: "16",
      exonHeightM: "10",
      intronGapM: "40",
      //
      showTranscriptGraphs: false,
      useFixedScale: false,
      //
      connectors: []  // List of {x1, y1, x2, y2}
    }
  },
  mounted: function () {
    this.$root.$on('resize', () => this.forceRedraw())
  },
  computed: {
      vertGap:  function () { return parseFloat(this.vertGapM) },
      exonHeight: function () { return parseFloat(this.exonHeightM) },
      intronGap: function () { return parseFloat(this.intronGapM) }
  },
  watch: {
    genes: function () { this.forceRedraw() },
    useFixedScale: function () { this.forceRedraw() },
    showTranscriptGraphs: function () { this.forceRedraw() },
    exonHeight: function () { this.layout() },
    intronGap: function () { this.layout() },
    vertGap: function () { this.layout() }
  },
  methods: {
    forceRedraw () {
        this.width = this.$el.getBoundingClientRect().width - 12
        this.myGenes = [].concat(this.genes)
        this.layout()
    },
    featureColor (f) {
        return this.featureColorMap.getColor(f)
    },
    layout () {
      this.ppbs = this.myGenes.map(g => {
          const w = this.width - this.intronGap * (g.composite.exons.length - 1)
          const ppb = w / g.composite.length
          return ppb
      })
      this.connectorCache = []
      this.featurePackers = []
      this.minPpb = Math.min.apply(null, this.ppbs)
      this.myGenes.forEach((g,i) => {
          this.ppb = this.useFixedScale ? this.minPpb : this.ppbs[i]
          this.layoutGene(g, i)
      })
    },
    layoutGene (gene, i) {
      // first layout the composite transcript's exons
      this.layoutComposite(gene.composite, i)
      // then layout each transcript's exons, using the composite as a guide
      gene.transcripts.forEach(t => this.layoutExons(t.exons, gene.composite.exons))
      // then layout connectors
      this.layoutConnectors(gene, i)
      this.$nextTick(() => this.drawConnectors(gene, i))
    },
    layoutComposite (comp, i) {
      // Part 1. Lay out the composite exons so they fill the space,
      // with a fixed amount of space between exons
      let x = 0
      comp.exons.forEach(e => {
         e.x = x
         e.y = e.y || 0
         e.width = this.ppb * (e.end - e.start + 1)
         x += e.width + this.intronGap
      })
      // Part 2. Lay out the distinct exons, used for drawing the
      // transcript graph. First, the x dimension
      this.layoutExons(comp.dExons, comp.exons)
      // Now the y
      const fp = this.featurePackers[i] = new FeaturePacker(this.vertGap,1)
      let maxy = 0
      comp.dExons.forEach(de => {
          de.y = fp.add(null, de.start, de.end, this.exonHeight)
          maxy = Math.max(maxy, de.y)
      })
      //
      if (this.showTranscriptGraphs) {
          this.heights[i] = maxy + this.exonHeight
      } else {
          const nts = this.myGenes[i].transcripts.length
          this.heights[i] = 2 * nts * this.exonHeight
      }
    },
    // Lays out a list of exons (first arg) against a set of already
    // laid out composite exons (second arg)
    layoutExons (exons, ces) {
      let ci = 0
      exons.forEach(e => {
        while (e.start > ces[ci].end) ci++;
        let de = (e.start - ces[ci].start) * this.ppb
        e.x = ces[ci].x + de
        e.y = 0
        e.width = this.ppb * (e.end - e.start + 1)
      })
    },
    layoutConnectors (g,i) {
        if (this.showTranscriptGraphs) {
            // Showing transcript graph. 
            // Each connector is a list of segments. Each segment is either a horizontal line, or 
            // a Bezier curve.
            //
            // connectors[i] is the list of connectors to draw for gene i
            // Each connector is a list of segments.
            // Each segment is a list of the form [cmd, x1, y1, x2, y2]
            // cmd is either 'L' for line or 'C' for curve
            this.connectors[i] = []
            this.connectorCache[i] = {} 
            const cExons = g.composite.exons
            const yAdjust = this.exonHeight / 2
            const packer = this.featurePackers[i]
            g.transcripts.forEach(t => {
                // for each transcript, map its exons to their counterparts
                // in the distinct exons list. Connect successive pairs of
                // distinct exons.
                t.exons.forEach((e,j) => {
                    if (j == 0) return
                    // draw connector from distinct exon j-1 to distinct exon j
                    const pde = t.exons[j-1].de // distinct exon j-1
                    const cde = t.exons[j].de   // distinct exon j
                    // First see if we've aready generated a path between these exons.
                    // If so, reuse it. Otherwise create (and cache) a new connector.
                    const cc = this.connectorCache[i]
                    const cc_key = `${pde.dIndex},${cde.dIndex}`
                    if (cc[cc_key]) {
                        // a hit! reuse (that is to say, copy) the path already generated.
                        const newConnector = [].concat(cc[cc_key])
                        this.connectors[i].push(newConnector)
                        return
                    }
                    //
                    const pce = pde.composite   // composite exon for d.e. j-1
                    const cce = cde.composite   // composite exon for d.e. j
                    const segments = []
                    // Initial horizontal segment from right right end of de to right end of its ce
                    segments.push(['L', pde.x+pde.width, pde.y+yAdjust, pce.x+pce.width, pde.y+yAdjust])

                    // Skipped exon(s). 
                    let pseg
                    const skipped = cExons.slice(pce.cIndex+1, cce.cIndex)
                    if (skipped.length) {
                        const fSkipped = skipped[0]
                        const lSkipped = skipped[skipped.length-1]
                        const start = fSkipped.start
                        const end = lSkipped.end
                        //
                        const y = packer.add(null, start, end, 1)
                        this.heights[i] = Math.max(this.heights[i], y + this.exonHeight)
                        //
                        pseg = segments[segments.length-1]
                        segments.push(['C', pseg[3], pseg[4], fSkipped.x, y+yAdjust])
                        //
                        pseg = segments[segments.length-1]
                        segments.push(['L', pseg[3], pseg[4], lSkipped.x + lSkipped.width, pseg[4]])
                    }

                    // Curved segment
                    pseg = segments[segments.length-1]
                    segments.push(['C', pseg[3], pseg[4], cce.x, cde.y+yAdjust])

                    // Final horizontal segment
                    pseg = segments[segments.length-1]
                    segments.push(['L', pseg[3], pseg[4], cde.x, cde.y+yAdjust])

                    // The list of segments is the new connector. Add it to the list.
                    this.connectors[i].push(segments)
                    // Cache it
                    cc[cc_key] = segments
                })
            })

        } else {
            // one transcript per line - add one connector per transcript from first exon to last
            this.connectors[i] = g.transcripts.map((t,j) => {
                const e1 = t.exons[0]
                const e2 = t.exons[t.exons.length - 1]
                const y = j * (this.exonHeight+this.vertGap) + this.exonHeight / 2 + 2
                return [['L', e1.x + 2, y, e2.x + e2.width - 2, y ]]
            })
            this.connectorCache[i] = {}
        }
    },
    drawConnectors (g, i) {
        const canvas = this.$el.querySelectorAll('canvas')[i]
        const cxt = canvas.getContext("2d")
        const ctors = this.connectors[i]
        cxt.clearRect(0, 0, canvas.width, canvas.height)
        cxt.lineWidth = 1
        cxt.strokeStyle = this.featureColor(g)
        ctors.forEach(seglist => {
            cxt.beginPath();
            seglist.forEach(seg => {
                const cmd = seg[0]
                const x1 = seg[1]
                const y1 = seg[2]
                const x2 = seg[3]
                const y2 = seg[4]
                cxt.moveTo(x1, y1);
                if (cmd === 'L') {
                    cxt.lineTo(x2, y2)
                } else if (cmd === 'C') {
                    const m = (x2 - x1) * .67
                    cxt.bezierCurveTo(x1 + m, y1, x2-m, y2, x2, y2)
                }
            })
            cxt.stroke();
        })
    },
    exonStyle (e, t, f) {
      return {
        left: e.x + 'px',
        top: e.y + 'px',
        width: e.width + 'px',
        height: this.exonHeight + 'px',
        backgroundColor: this.featureColor(f)
      }
    }
  }
})
</script>

<style scoped>
.gene {
  border-top: thin solid black;
}
.transcript {
  height: 15px;
  position: relative;
}
.exon {
  position: absolute;
}
.exon-graph {
  position: relative;
}
.exon-label {
  position: absolute;
  left: 0px;
  bottom: 6px;
  font-size: 10px;
  font-weight: bold;
  color: black;
}
.small-label {
  font-size: 10px;
}
</style>
