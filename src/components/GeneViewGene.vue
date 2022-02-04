<template>
  <div class="gene-view-gene gene flexcolumn" v-if="myGene">
      <span class="title">{{myGene.genome.name}} :: {{myGene.symbol}}</span>
      <svg :height="height + 16" :width="geneWidth">
        <!-- underlay -->
        <rect
            class="underlay"
            x="0"
            y="0"
            :width="geneWidth"
            :height="height+8"
            fill="#ffffff"
            opacity="0"
            @click="clearSelectedExons"
            />
        <!-- Drawing area. Transformed so to line of text is visible. -->
        <g transform="translate(0,8)" >
          <!-- connectors -->
          <path
              v-for="(ctor,cti) in connectors"
              :key="'ctor'+cti"
              class="connector"
              :stroke="ctor[0]"
              fill="none"
              stroke-width="2"
              :d="drawConnector(ctor)"
              />
          <!-- graph view -->
          <g v-if="showTranscriptGraph">
              <!-- exons -->
              <g v-for="(de, ri) in myGene.composite.dExons"
                  :key="'exon.de.'+ri"
                  >
                  <!-- the box -->
                  <rect
                      :name="de.dIndex"
                      class="exon"
                      :x="de.x"
                      :y="de.y"
                      :width="de.width"
                      :height="exonHeight"
                      :fill="exonFillColor(de)"
                      :stroke="exonBorderColor(de)"
                      @click="clickExon"
                      />
                  <!-- start/stop codon markers -->
                  <g v-for="(te, ti) in de.tExons"
                      :key="`cdss.${ri}.${ti}`"
                      >
                      <line v-if="te.cStartX"
                          :x1="te.cStartX"
                          :y1="de.y"
                          :x2="te.cStartX"
                          :y2="de.y + exonHeight"
                          :stroke="myGene.strand==='-' ? 'red' : 'cyan'"
                          stroke-width="2"
                          />
                      <line v-if="te.cEndX"
                          :x1="te.cEndX"
                          :y1="de.y"
                          :x2="te.cEndX"
                          :y2="de.y + exonHeight"
                          :stroke="myGene.strand==='-' ? 'cyan' : 'red'"
                          stroke-width="2"
                          />
                  </g> <!-- start/stop codons -->
                  <!-- exon-labels -->
                  <text
                      class="exon-label unselectable-text"
                      :name="de.dIndex"
                      :x="de.x"
                      :y="de.y - 1"
                      font-size="10"
                      font-weight="bold"
                      @click="clickExon"
                      >{{de.dIndex}}</text>
              </g> <!-- v-for -->
          </g>
          <!-- "Normal" view: one transcript per line -->
          <g v-else>
              <!-- each transcript -->
              <g v-for="(t, ti) in myGene.transcripts"
                  :key="'transcript'+ti"
                  >
                  <g v-for="(te, tei) in t.exons"
                    :key="'exon'+ti+'.'+tei"
                    >
                      <!-- exons -->
                      <rect 
                          class="exon"
                          :name="te.de.dIndex"
                          :x="te.x"
                          :y="te.y + ti * (exonHeight+vertGap)"
                          :width="te.width"
                          :height="exonHeight"
                          :fill="exonFillColor(te)"
                          :stroke="exonBorderColor(te)"
                          @click="clickExon"
                          />
                      <line v-if="te.cStartX"
                          :x1="te.cStartX"
                          :y1="te.y + ti * (exonHeight+vertGap)"
                          :x2="te.cStartX"
                          :y2="te.y + exonHeight + ti * (exonHeight+vertGap)"
                          :stroke="myGene.strand==='-' ? 'red' : 'cyan'"
                          stroke-width="2"
                          />
                      <line v-if="te.cEndX"
                          :x1="te.cEndX"
                          :y1="te.y + ti * (exonHeight+vertGap)"
                          :x2="te.cEndX"
                          :y2="te.y + exonHeight + ti * (exonHeight+vertGap)"
                          :stroke="myGene.strand==='-' ? 'cyan' : 'red'"
                          stroke-width="2"
                          />
                      <!-- exon-labels -->
                      <text 
                          class="exon-label unselectable-text"
                          :name="te.de.dIndex"
                          :x="te.x"
                          :y="te.y + ti * (exonHeight+vertGap) - 1"
                          font-size="10"
                          font-weight="bold"
                          @click="clickExon"
                          >{{te.de.dIndex}}</text>
                  </g> <!-- exon -->
              </g> <!-- v-for -->
          </g> <!-- v-else -->
        </g>
      </svg>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import { FeaturePacker } from '@/lib/Layout'
export default MComponent({
  name: 'GeneViewGene',
  props: {
      gene: {
          type: Object // the gene to draw. See note below with data() function.
      },
      width: { // view area width in px
          type: Number,
          default: 800
      }, 
      exonWidth: {  // exon width in px (only appl. when fixedExonWidth is true
          type: Number,
          default: 25
      },
      intronGap: {  // gap betweeen exons in px
          type: Number,
          default: 40
      },
      exonHeight: { // height of an exon in px
          type: Number,
          default: 16
      },
      vertGap: { // spacing bewteen exons
          type: Number,
          default: 24
      },
      showTranscriptGraph: { // if true, draw graph, else draw transcripts one per line
          type: Boolean,
          default: false
      },
      fitToWidth: { // if true, scale horizontally so layout fills the given vidth
          type: Boolean,
          default: true
      },
      fixedExonWidths: { // if true, draw all exons the same width (see exonWidth),
                       // else, make exon widths proportional to actual lengths
          type: Boolean,
          default: false
      },
      selectedColor: { // color to use to draw a selected exon
          type: String,
          default: "#00ff00"
      }
  },
  inject: ['featureColorMap', 'dataManager'],
  data: function () {
    return {
      // When the gene property changes, Vue fires reactive calls immediately.
      // However, we need the layout to run first _before_ the gene is rendered.
      // Therefore we have both a gene property and a myGene data object. 
      // Drawing is based off myGene (see template above).
      // When the gene property changes, layout() is called. When that finishes,
      // myGene is assigned, which triggers the rendering.
      myGene: null,
      //
      height: 100,
      ppb: 0.5,
      connectors: [],
      overExon: null,
      selectedExons: [],
      geneWidth: 800
    }
  },
  mounted: function () {
      this.$watch('$props', () => this.layout(), {deep:true})
      if (this.gene) this.layout().then(() => { this.myGene = this.gene })
  },
  watch: {
      // Watch for changes to the gene property.
      gene:          function () { this.forceRedraw() },
      selectedExons: function () { this.forceRedraw() }
  },
  computed: {
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
      },
      featureColor () {
        return this.featureColorMap.getColor(this.gene)
      }
  },
  methods: {
    forceRedraw () {
        this.layout().then(() => {
            this.myGene = this.gene
        })
    },
    // given the div representing an exon, return that exon
    elt2exon (elt) {
      const eElt = elt.closest('.exon,.exon-label')
      if (!eElt) return null
      const ei = parseInt(eElt.getAttribute('name'))
      const de = this.gene.composite.dExons[ei]
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
    // Assigns coordinates to exons and computes connector paths.
    layout () {
      return this.ensureModel().then(() => {
          // nominal scale factor (fits the composite transcript exactly)
          this.ppb = (this.width - this.gene.composite.exons.length + 1) / this.gene.composite.length
          // avoid drawing the same connector twice
          this.connectorCache = []
          // for laying out distinct exons in graph view
          this.featurePacker = new FeaturePacker(this.vertGap,10)
          // first layout the composite transcript's exons
          this.geneWidth = this.layoutComposite()
          // then layout each transcript's exons, using the composite as a guide
          this.gene.transcripts.forEach(t => this.layoutExons(t.exons))
          // then layout connectors
          this.layoutConnectors()
          return this.geneWidth
      })
    },
    layoutComposite () {
      // Part 1. Lay out the composite exons
      const comp = this.gene.composite
      let x = 0
      // when drawing proportional exon widths, turn exonWidth slider value into a multiplier
      // ranging from 0 to 1 (left of slider center) and from 1 to 10 (right).
      this.xmult = this.exonWidth <= 100 ? (this.exonWidth / 100) : (1 + (this.exonWidth - 100)/20)
      comp.exons.forEach(e => {
         e.x = x
         e.y = e.y || 0
         e.width = this.fixedExonWidths ? this.exonWidth : this.xmult * this.ppb * (e.end - e.start + 1)
         x += e.width + this.intronGap

         if (isNaN(e.y)) throw ("NaN detected")
      })
      let compWidth = x - this.intronGap

      // Part 2. If fitToWidth is true, scale the composite exon coordinates
      if (this.fitToWidth) {
          const sf = this.width / compWidth
          comp.exons.forEach(ce => {
              ce.x = sf * ce.x
              ce.width = sf * ce.width
          })
          compWidth = this.width
      }

      // Part 3. Lay out the distinct exons, used for drawing the
      // transcript graph. First, the x dimension
      this.layoutExons(comp.dExons)
      // Now the y
      let maxy = 0
      comp.dExons.forEach(de => {
          de.y = this.featurePacker.add(null, de.start, de.end, this.exonHeight, true)
          if (isNaN(de.y)) throw ("NaN detected")
          maxy = Math.max(maxy, de.y)
      })
      // At this point, we can re-shuffle the vertical positions of exons
      // within each conting to try to lessen the line crossings in the final
      // diagram. 
      // One easy heuristic to try: resort according to number of transcripts
      // that include the exon.
      comp.exons.forEach(ce => {
          // Create a list of the current y positions
          const ys = ce.dExons.map(de => de.y).sort((a, b) => a - b)
          // Resort the distinct exons by number of transcripts
          const des = ce.dExons.sort((de1, de2) => {
              const n1 = de1.tExons.length
              const n2 = de2.tExons.length
              return n1 !== n2 ? n2 - n1 : de1.dIndex - de2.dIndex
          })
          // Assign the y positions
          des.forEach((de, i) => {
              de.y = ys[i]
              if (isNaN(de.y)) throw ("NaN detected")
          })
      })

      //
      if (this.showTranscriptGraph) {
          this.height = maxy + this.exonHeight
      } else {
          const nts = this.gene.transcripts.length
          this.height = nts * this.exonHeight + (nts - 1) * this.vertGap
      }
      //
      return compWidth
    },
    // Lays out a list of exons against already-laid-out composite exons
    layoutExons (exons) {
      exons.forEach(e => {
        const comp = e.composite || e.de.composite
        if (!comp) throw "Internal error: no composite exon."
        if (this.fixedExonWidths) {
            e.x = comp.x
            e.width = this.exonWidth
            e.y = 0
            if (e.cStart) e.cStartX = e.x + ((e.cStart - e.start) / e.length) * e.width
            if (e.cEnd) e.cEndX = e.x + ((e.cEnd - e.start) / e.length) * e.width
        } else {
            let scale = this.ppb * this.xmult
            let dx = scale * (e.start - comp.start)
            e.x = comp.x + dx
            e.width = scale * (e.end - e.start + 1)
            e.y = 0
            if (e.cStart) e.cStartX = e.x + ((e.cStart - e.start) / e.length) * e.width
            if (e.cEnd) e.cEndX = e.x + ((e.cEnd - e.start) / e.length) * e.width
        }  
      })
    },
    exonFillColor (e) {
        if (this.isTranscriptSelected(e)) {
            return this.selectedColor
        }
        return this.featureColor
    },
    exonBorderColor (e) {
        let de = e.de || e
        if (this.isTranscriptSelected(de)) {
            return this.featureColor
        } else if (this.isExonSelected(de)) {
            return this.selectedColor
        } else {
            return this.featureColor
        }
    },
    connectorColor (e1, e2) {
        if (this.isTranscriptSelected(e1) && this.isTranscriptSelected(e2)) {
            return this.selectedColor
        } else {
            return this.featureColor
        }
    },
    layoutConnectors () {
        if (this.showTranscriptGraph) {
            // Showing transcript graph. 
            // Each connector is a list of segments. Each segment is either a horizontal line, or 
            // a Bezier curve.
            //
            // this.connectors is the list of connectors to draw this.gene
            // Each connector is a list of segments.
            // Each segment is a list of the form [cmd, x1, y1, x2, y2]
            // cmd is either 'L' for line or 'C' for curve
            this.connectors = []
            this.connectorCache = {} 
            const cExons = this.gene.composite.exons
            const yAdjust = this.exonHeight / 2
            this.gene.transcripts.forEach(t => {
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
                    const cc = this.connectorCache
                    const cc_key = `${pde.dIndex},${cde.dIndex}`
                    if (cc[cc_key]) {
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
                      this.connectors.push(segments)
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
                        const y = this.featurePacker.add(null, start, end, 1)
                        this.height = Math.max(this.height, y + this.exonHeight)
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
                    this.connectors.push(segments)
                    // Cache it
                    cc[cc_key] = segments
                })
            })

        } else {
            this.connectors = []
            // one transcript per line - add one connector per transcript from first exon to last
            const segments = this.gene.transcripts.map((t,j) => {
                const e1 = t.exons[0]
                const e2 = t.exons[t.exons.length - 1]
                const y = j * (this.exonHeight+this.vertGap) + this.exonHeight / 2
                const cColor = this.selectedTranscriptSet.has(e1.transcript) ? this.selectedColor : this.featureColor
                return [cColor, ['L', e1.x + 2, y, e2.x + e2.width - 2, y ]]
            })
            this.connectors = segments
            this.connectorCache = {}
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
    ensureModel () {
        const g = this.gene
        if (g.transcripts.length) return Promise.resolve(g)
        return this.dataManager().getGenes(g.genome, g.chr, g.start-1, g.end+1, true).then(() => {
            return g
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
.connector:hover {
    stroke-width: 3;
    stroke: orange;
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
}
.disabled, .disabled * {
    color: gray;
    pointer-events: none;
}
.title {
    text-align: left;
    background-color: #bbb;
}
</style>
