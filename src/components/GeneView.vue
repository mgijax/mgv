<template>
  <div class="gene-view flexcolumn" >
    <div class="sticky-header flexcolumn">
        <!-- Controls -->
        <div class="controls flexrow" style="justify-content: flex-start;">

            <!-- Toggle: drawing style -->
            <div class="flexcolumn">
            <span class="small-label">Layout</span>
            <div class="flexrow" style="justify-content: flex-start;">
                <span class="small-label">Normal</span>
                <m-button
                  :icon="showTranscriptGraphs ? 'toggle_on' : 'toggle_off'"
                  :title="showTranscriptGraphs ? '' : ''"
                  @click="showTranscriptGraphs = !showTranscriptGraphs"
                  />
                <span class="small-label">Graphs</span>
            </div>
            </div>

            <!-- Toggle: Overall width  -->
            <div class="flexcolumn">
            <span class="small-label">Overall width</span>
            <div class="flexrow" style="justify-content: flex-start;">
                <span class="small-label">Overflow</span>
                <m-button
                  :icon="fitToWindow ? 'toggle_off' : 'toggle_on'"
                  :title="fitToWindow ? 'Using fixed scale. Click for proportional scale.' : 'Using proportional scale. Click for fixed scale.'"
                  @click="fitToWindow = !fitToWindow"
                  />
                <span class="small-label">Fit</span>
            </div>
            </div>

            <!-- Toggle: exon width  -->
            <div class="flexcolumn">
            <span class="small-label">Exon scale</span>
            <div class="flexrow" style="justify-content: flex-start;">
                <span class="small-label">Fixed</span>
                <m-button
                  :icon="fixedExonWidths ? 'toggle_off' : 'toggle_on'"
                  :title="fixedExonWidths ? 'Using fixed scale. Click for proportional scale.' : 'Using proportional scale. Click for fixed scale.'"
                  @click="fixedExonWidths = !fixedExonWidths"
                  />
                <span class="small-label">Proportional</span>
            </div>
            </div>

            <!-- Slider: exon width  -->
            <div class="slider" :class="{ disabled: !fixedExonWidths }">
                <span class="small-label">Exon width</span>
                <input :disabled="!fixedExonWidths" type="range" min="10" max="200" v-model="exonWidthM" />
            </div>
            <!-- Slider: Intron gap  -->
            <div class="slider">
                <span class="small-label">Intron gap</span>
                <input type="range" min="1" max="100" v-model="intronGapM" />
            </div>
            <!-- Slider: Exon thickness  -->
            <div class="slider">
                <span class="small-label">Exon thickness</span>
                <input type="range" min="1" max="24" v-model="exonHeightM" />
            </div>
            <!-- Slider: Vertical gap  -->
            <div class="slider">
                <span class="small-label">Vertical gap</span>
                <input type="range" min="1" max="32" v-model="vertGapM" />
            </div>
        </div>
        <!-- Status/messages -->
        <div class="flexrow status-area">
            <span>{{statusText}}</span>
        </div>
    </div> <!-- end of sticky-header -->
    <!-- Genes display area -->
    <div
      v-for="(g,i) in myGenes"
      :key="i"
      class="gene flexcolumn"
      :name="i"
      @click="clearSelectedExons"
      >

      <span>{{g.genome.name}} :: {{g.symbol}}</span>

      <svg :height="heights[i]+8" :width="maxGeneWidth">
        <g transform="translate(0,8)">
          <!-- Graph view -->
          <g v-if="showTranscriptGraphs">
              <!-- connectors -->
              <path
                  v-for="(ctor,cti) in connectors[i]"
                  :key="'ctor'+cti"
                  class="connector"
                  :stroke="ctor[0]"
                  fill="none"
                  stroke-width="2"
                  :d="drawConnector(ctor)"
                  />
              <!-- exons -->
              <rect v-for="(de, ri) in g.composite.dExons"
                  :key="'exon.de.'+ri"
                  :name="de.dIndex"
                  class="exon"
                  :x="de.x"
                  :y="de.y"
                  :width="de.width"
                  :height="exonHeight"
                  :fill="exonFillColor(de)"
                  :stroke="exonBorderColor(de)"
                  @click="clickExon"
                  ><title>{{de.dIndex}}</title>
              </rect>    
              <!-- exon-labels -->
              <text v-for="(de, dei) in g.composite.dExons"
                  :key="'exon'+dei"
                  class="exon-label unselectable-text"
                  :name="de.dIndex"
                  :x="de.x"
                  :y="de.y - 1"
                  font-size="10"
                  font-weight="bold"
                  @click="clickExon"
                  >{{de.dIndex}}</text>
          </g>
          <!-- Standard view: one transcript per line -->
          <g v-else>
              <!-- connectors -->
              <path v-for="(ctor, ci) in connectors[i]"
                  :key="'path'+ci"
                  class="connector"
                  :stroke="ctor[0]"
                  :d="drawConnector(ctor)"
              />
              <!-- exons + labels -->
              <g v-for="(t, ti) in g.transcripts"
                  :key="'transcript'+ti"
                  >
                  <!-- exons -->
                  <rect v-for="(te, tei) in t.exons"
                      :key="'exon'+ti+'.'+tei"
                      class="exon"
                      :name="te.de.dIndex"
                      :x="te.x"
                      :y="te.y + ti * (exonHeight+vertGap)"
                      :width="te.width"
                      :height="exonHeight"
                      :fill="exonFillColor(te)"
                      :stroke="exonBorderColor(te)"
                      @click="clickExon"
                      ><title>{{te.de.dIndex}}</title>
                  </rect>
                  <!-- exon-labels -->
                  <text v-for="(te, tei) in t.exons"
                      :key="'exon'+ti+'.'+tei+'.2'"
                      class="exon-label unselectable-text"
                      :name="te.de.dIndex"
                      :x="te.x"
                      :y="te.y + ti * (exonHeight+vertGap) - 1"
                      font-size="10"
                      font-weight="bold"
                      @click="clickExon"
                      >{{te.de.dIndex}}</text>
              </g>
          </g>
        </g>
      </svg>
    </div> <!-- v-for -->
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import { FeaturePacker } from '@/lib/Layout'
// import u from '@/lib/utils'
export default MComponent({
  name: 'GeneView',
  components: { MButton },
  props: ['genes'],
  inject: ['featureColorMap', 'dataManager'],
  data: function () {
    return {
      myGenes: [].concat(this.genes),
      // width (in px) of drawing area
      width: 800,
      // calculated maximum display width of any gene
      maxGeneWidth: 800,
      // height
      heights: this.genes.map(() => 100),
      // pixels per base
      ppb: 0.5,
      //
      vertGapM: "16",
      exonHeightM: "10",
      exonWidthM: "25",
      intronGapM: "40",
      //
      showTranscriptGraphs: false,
      fitToWindow: false,
      fixedExonWidths: false,
      //
      connectors: [],
      //
      overExon: null,
      selectedExons: [],
      selectedColor: "#00ff00",
      selectedColor2: "#ffff00"
    }
  },
  mounted: function () {
    this.$root.$on('resize', () => this.forceRedraw())
  },
  computed: {
      vertGap:  function () { return parseFloat(this.vertGapM) },
      exonHeight: function () { return parseFloat(this.exonHeightM) },
      exonWidth: function () { return parseFloat(this.exonWidthM) },
      intronGap: function () { return parseFloat(this.intronGapM) },
      overTranscripts: function () {
          if (!this.overExon) return []
          // mouse is over a distinct exon. Traverse from d.e. to 
          // transcript exons to transcripts
          const tes = this.overExon.tExons
          const ts = Array.from(new Set(tes.map(e => e.transcript)))
          return ts
      },
      selectedExonSet: function () {
          return new Set(this.selectedExons)
      },
      selectedTranscripts: function () {
          return Array.from(this.selectedTranscriptSet)
      },
      selectedTranscriptSet: function () {
          if (this.selectedExons.length === 0) return new Set()
          const sts = this.selectedExons.reduce((s,de) => {
              de.tExons.forEach(te => s.add(te.transcript))
              return s
          }, new Set())
          return sts
      },
      statusText: function () {
          const labels = this.selectedTranscripts.map(t => t.label)
          return labels.join(", ") || "."
      }
  },
  watch: {
    genes:                function () { this.forceRedraw() },
    fitToWindow:          function () { this.forceRedraw() },
    fixedExonWidths:      function () { this.forceRedraw() },
    showTranscriptGraphs: function () { this.forceRedraw() },
    exonHeight:           function () { this.forceRedraw() },
    exonWidth:            function () { this.forceRedraw() },
    intronGap:            function () { this.forceRedraw() },
    vertGap:              function () { this.forceRedraw() },
    selectedExons:        function () { this.forceRedraw() }
  },
  methods: {
    // Force the scene to be redrawn.
    forceRedraw () {
        this.$nextTick(() => {
            this.myGenes = [].concat(this.genes)
            this.layout()
        })
    },
    // given the div representing an exon, return that exon
    elt2exon (elt) {
      const eElt = elt.closest('.exon,.exon-label')
      if (!eElt) return null
      const ei = parseInt(eElt.getAttribute('name'))
      const gDiv = eElt.closest('.gene')
      if (!gDiv) return null
      const gi = parseInt(gDiv.getAttribute('name'))
      const g = this.genes[gi]
      const de = g.composite.dExons[ei]
      return de
    },
    mouseoverExon (evt) {
      this.overExon = this.elt2exon(evt.target)
    },
    mouseoutExon () {
      this.overExon = null
    },
    clickExon (evt) {
        const de = this.elt2exon(evt.target)
        if (!de) return
        this.selectExon(de, !evt.shiftKey)
        evt.stopPropagation()
        evt.preventDefault()
    },
    //
    exon2gene (e) {
        const te = e.dExons ? e.dExons[0].tExons[0] : e.tExons ? e.tExons[0] : e
        return te.transcript.gene
    },
    // Returns true iff this exon is currently selected.
    isExonSelected (de) {
        return this.selectedExonSet.has(de)
    },
    // If e is a transcript exon, returns true iff e.transcript is selected.
    // If e is a distinct exon, returns true iff te.transcipt is selected for any te in e.tExons.
    isTranscriptSelected (e) {
        if (e.transcript) {
            // e is a transcript exon
            return this.selectedTranscriptSet.has(e.transcript)
        } else {
            // e is a distinct exon
            return e.tExons.reduce((v,te) => {
                return v || this.selectedTranscriptSet.has(te.transcript)
            }, false)
        }
    },
    // Add exon to selected set. If unselectOthers is true,
    // also removes everything else from the set.
    selectExon (de, unselectOthers) {
        if (unselectOthers) this.clearSelectedExons()
        this.selectedExons.push(de)
    },
    // Removes exon from the selected set.
    unselectExon (de) {
        const i = this.selectedExons.indexOf(de)
        if (i >= 0) this.selectedExons.splice(i,1)
    },
    // Empties the selection set.
    clearSelectedExons () {
        this.selectedExons = []
    },
    // Returns the color for feature based on feature type.
    featureColor (f) {
        return this.featureColorMap.getColor(f)
    },
    // Assigns coordinates to exons and computes connector paths.
    layout () {
      this.width = this.$el.getBoundingClientRect().width - 12
      if (this.myGenes.length === 0) return
      const ps = this.myGenes.map(g => this.ensureModels(g))
      Promise.all(ps).then(() => {
          this.ppbs = this.myGenes.map(g => {
              const w = this.width - this.intronGap * (g.composite.exons.length - 1)
              const ppb = w / g.composite.length
              return ppb
          })
          this.connectorCache = []
          this.featurePackers = []
          const geneWidths = this.myGenes.map((g,i) => {
              this.ppb = this.ppbs[i]
              return this.layoutGene(g, i)
          })
          this.maxGeneWidth = geneWidths.length ? Math.max.apply(null, geneWidths) : 800
      })
    },
    // Compute coordinates for exons and calculate connector paths for this gene.
    layoutGene (gene, i) {
      // first layout the composite transcript's exons
      const compWidth = this.layoutComposite(gene.composite, i)
      // then layout each transcript's exons, using the composite as a guide
      gene.transcripts.forEach(t => this.layoutExons(t.exons, gene.composite.exons))
      // then layout connectors
      this.layoutConnectors(gene, i)
      return compWidth
    },
    layoutComposite (comp, i) {
      // Part 1. Lay out the composite exons
      let x = 0
      comp.exons.forEach(e => {
         e.x = x
         e.y = e.y || 0
         e.width = this.fixedExonWidths ? this.exonWidth : this.ppb * (e.end - e.start + 1)
         x += e.width + this.intronGap
      })
      const compWidth = x
      // Part 2. Lay out the distinct exons, used for drawing the
      // transcript graph. First, the x dimension
      this.layoutExons(comp.dExons, comp.exons)
      // Now the y
      const fp = this.featurePackers[i] = new FeaturePacker(this.vertGap,10)
      let maxy = 0
      comp.dExons.forEach(de => {
          de.y = fp.add(null, de.start, de.end, this.exonHeight, true)
          maxy = Math.max(maxy, de.y)
      })
      // At this point, we can re-shuffle the vertical positions of exons
      // within each conting to try to lessen the line crossings in the final
      // diagram. 
      // One easy heuristic to try: resort according to number of transcripts
      // that include the exon.
      comp.exons.forEach(ce => {
          // Create a list of the current y positions
          const ys = ce.dExons.map(de => de.y).sort((a, b) => b - a)
          // Resort the distinct exons by number of transcripts
          const des = ce.dExons.sort((de1, de2) => {
              const n1 = de1.tExons.length
              const n2 = de2.tExons.length
              return n1 - n2
          })
          // Assign the y positions
          des.forEach((de, i) => {
              de.y = ys[i]
          })
      })

      //
      if (this.showTranscriptGraphs) {
          this.heights[i] = maxy + this.exonHeight
      } else {
          const nts = this.myGenes[i].transcripts.length
          this.heights[i] = nts * this.exonHeight + (nts - 1) * this.vertGap
      }
      //
      return compWidth
    },
    // Lays out a list of exons (first arg) against a set of already
    // laid out composite exons (second arg)
    layoutExons (exons) {
      exons.forEach(e => {
        const comp = e.composite || e.de.composite
        if (!comp) throw "Internal error: no composite exon."
        if (this.fixedExonWidths) {
            e.x = comp.x
            e.width = this.exonWidth
            e.y = 0
        } else {
            let dx = (e.start - comp.start) * this.ppb
            e.x = comp.x + dx
            e.width = this.ppb * (e.end - e.start + 1)
            e.y = 0
        }  
      })
    },
    exonFillColor (e) {
        let de = e.de || e
        const te = de.dExons ? de.dExons[0].tExons[0] : (de.tExons ? de.tExons[0] : de)
        const f = te.transcript.gene
        if (this.isTranscriptSelected(e)) {
            return this.selectedColor
            // return this.isExonSelected(de) ? this.selectedColor : this.featureColor(f)
        }
        return this.featureColor(f)
    },
    exonBorderColor (e) {
        let de = e.de || e
        const te = de.dExons ? de.dExons[0].tExons[0] : (de.tExons ? de.tExons[0] : de)
        const f = te.transcript.gene
        if (this.isTranscriptSelected(de)) {
            return this.featureColor(f)
        } else if (this.isExonSelected(de)) {
            return this.selectedColor
        } else {
            return this.featureColor(f)
        }
    },
    connectorColor (e1, e2) {
        if (this.isTranscriptSelected(e1) && this.isTranscriptSelected(e2)) {
            return this.selectedColor
        } else {
            return this.featureColor(this.exon2gene(e1))
        }
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
            this.connectors.splice(i, 1, [])
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
                    // If so, we're done.
                    // Otherwise create (and cache) a new connector.
                    const cc = this.connectorCache[i]
                    const cc_key = `${pde.dIndex},${cde.dIndex}`
                    if (cc[cc_key]) {
                        //const newConnector = [].concat(cc[cc_key])
                        //this.connectors[i].push(newConnector)
                        return
                    }
                    // Determine color for connector.
                    const cColor = this.connectorColor(pde, cde)
                    //
                    const pce = pde.composite   // composite exon for d.e. j-1
                    const cce = cde.composite   // composite exon for d.e. j
                    const segments = []
                    //
                    // The first element of segments is the color to draw them
                    segments.push(cColor)
                    //
                    if (pce === cce) {
                      // connecting two exons in the same contig. 
                      segments.push(['C', pde.x+pde.width, pde.y+yAdjust, cde.x, cde.y+yAdjust])
                      this.connectors[i].push(segments)
                      cc[cc_key] = segments
                      return
                    }
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
            this.connectors.splice(i, 1, [])
            // one transcript per line - add one connector per transcript from first exon to last
            const segments = g.transcripts.map((t,j) => {
                const e1 = t.exons[0]
                const e2 = t.exons[t.exons.length - 1]
                const y = j * (this.exonHeight+this.vertGap) + this.exonHeight / 2
                const cColor = this.selectedTranscriptSet.has(e1.transcript) ? this.selectedColor : this.featureColor (e1.transcript.gene)
                return [cColor, ['L', e1.x + 2, y, e2.x + e2.width - 2, y ]]
            })
            this.connectors[i] = segments
            this.connectorCache[i] = {}
        }
    },
    drawConnector (ctor) {
        const path = ctor.reduce((p,seg) => {
            if (typeof(seg) === 'string') return p
            let pnew = [p]
            const cmd = seg[0]
            const x1 = seg[1]
            const y1 = seg[2]
            const x2 = seg[3]
            const y2 = seg[4]

            pnew.push(`M ${x1} ${y1}`)
            if (cmd === 'L') {
                pnew.push(`L ${x2} ${y2}`)
            } else if (cmd === 'C') {
                const m = (x2 - x1) * .67
                pnew.push(`C ${x1 + m}, ${y1}, ${x2-m}, ${y2}, ${x2}, ${y2}`)
            }
            return pnew.join(' ')
        }, '')
        return path
    },
    // Returns a promise that resolves after the transcripts for the specified gene
    // have been loaded. 
    // Example scenario: user opens the browser on a large region (larger than the details threshold),
    // and a gene is selected.
    ensureModels (gene) {
        if (gene.transcripts.length) return Promise.resolve(gene)
        return this.dataManager().getGenes(gene.genome, gene.chr, gene.start-1, gene.end+1, true).then(() => {
            return gene
        })
    }
  }
})
</script>

<style scoped>
.gene-view {
    overflow: scroll;
}
.controls > * {
    flex-grow: 0;
    margin-right: 16px;
}
.gene {
  border-bottom: thin solid black;
}
.transcript {
  height: 15px;
}
.exon {
}
.exon-label {
  position: absolute;
  left: 0px;
  bottom: 6px;
  font-size: 10px;
  font-weight: bold;
  color: black;
}
.connector {
}
.small-label {
  font-size: 10px;
}
.status-area {
  white-space: nowrap;
  overflow: scroll;
  font-size: 10px;
}
.sticky-header {
  border-bottom: thin solid black;
  position: sticky;
  top: 0;
  left: 0;
  background-color: #e1e1e1;
  z-index: 10;
}
.slider {
    padding-top: 0px;
    padding-bottom: 0px;
    width: 80px;
}
.slider * {
    padding-top: 0px;
    padding-bottom: 0px;
}
.underlay {
    pointer-events: none;
}
.disabled, .disabled * {
    color: gray;
    pointer-events: none;
}
</style>
