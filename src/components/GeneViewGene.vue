<template>
  <div class="gene-view-gene gene flexcolumn" v-if="myGene">
      <span class="title flexrow">
          <span>
              <span>{{myGene.genome.name}} :: {{myGene.symbol}} </span>
              <span class="small-label">{{selectedText}}</span>
          </span>
          <m-button
              icon="shopping_cart"
              title="Click to add selected transcripts to sequence cart."
              @click="clickCart"
              />
      </span>
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
            @click="clearSelectedTranscripts"
            />
        <!-- Drawing area. Transformed so the line of text is visible. -->
        <g transform="translate(0,8)" >
          <!-- connectors -->
          <path
              v-for="(ctor,cti) in connectors"
              :key="'ctor.'+cti"
              :name="cti"
              class="connector"
              :stroke="connectorColor(ctor)"
              :stroke-width="connectorStrokeWidth(ctor)"
              fill="none"
              :d="drawConnector(ctor)"
              @click="clickConnector"
              @mouseover="mouseoverConnector"
              @mouseout="mouseoutConnector"
              />
          <!-- graph view -->
          <g v-if="showTranscriptGraph">
              <!-- exons -->
              <g v-for="(de, ri) in myGene.composite.dExons"
                  :key="'exon.de.'+ri"
                  >
                  <!-- the box -->
                  <rect
                      :name="'*.' + de.dIndex"
                      class="exon"
                      :x="de.x"
                      :y="de.y"
                      :width="de.width"
                      :height="exonHeight"
                      :fill="exonFillColor(de)"
                      :stroke="exonBorderColor(de)"
                      :stroke-width="exonBorderWidth(de)"
                      @click="clickExon"
                      @mouseover="mouseoverExon"
                      @mouseout="mouseoutExon"
                      />
                  <!-- start/stop codon markers -->
                  <g v-for="(te, ti) in de.tExons"
                      :key="`cdss.${ri}.${ti}`"
                      >
                      <line v-if="te.cStartX"
                          :class="myGene.strand==='+' ? 'start-codon' : 'stop-codon'"
                          :x1="te.cStartX"
                          :y1="de.y"
                          :x2="te.cStartX"
                          :y2="de.y + exonHeight"
                          :stroke="myGene.strand==='+' ? 'cyan' : 'red'"
                          stroke-width="2"
                          />
                      <line v-if="te.cEndX"
                          :class="myGene.strand==='+' ? 'stop-codon' : 'start-codon'"
                          :x1="te.cEndX"
                          :y1="de.y"
                          :x2="te.cEndX"
                          :y2="de.y + exonHeight"
                          :stroke="myGene.strand==='+' ? 'red' : 'cyan'"
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
                  class="transcript"
                  :name="t.ID"
                  >
                  <g v-for="(te, tei) in t.exons"
                    :key="'exon'+ti+'.'+tei"
                    >
                      <!-- exons -->
                      <rect 
                          class="exon"
                          :name="t.tIndex + '.' + te.eIndex"
                          :x="te.x"
                          :y="te.y + ti * (exonHeight+vertGap)"
                          :width="te.width"
                          :height="exonHeight"
                          :fill="exonFillColor(te)"
                          :stroke="exonBorderColor(te)"
                          :stroke-width="exonBorderWidth(te)"
                          @click="clickExon"
                          @mouseover="mouseoverExon"
                          @mouseout="mouseoutExon"
                          />
                      <line v-if="te.cStartX"
                          :class="myGene.strand==='+' ? 'start-codon' : 'stop-codon'"
                          :x1="te.cStartX"
                          :y1="te.y + ti * (exonHeight+vertGap)"
                          :x2="te.cStartX"
                          :y2="te.y + exonHeight + ti * (exonHeight+vertGap)"
                          :stroke="myGene.strand==='-' ? 'red' : 'cyan'"
                          stroke-width="2"
                          />
                      <line v-if="te.cEndX"
                          :class="myGene.strand==='+' ? 'stop-codon' : 'start-codon'"
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
//import u from '@/lib/utils'
import MButton from '@/components/MButton'
export default MComponent({
  name: 'GeneViewGene',
  components: { MButton },
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
      },
      selectedColor2: { // color to use to draw a selected exon
          type: String,
          default: "rgb(52, 255, 154)"
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
      geneWidth: 800,
      connectors: [],
      overConnector: null
    }
  },
  mounted: function () {
      this.$watch('$props', () => this.forceRedraw(), {deep:true})
      this.$root.$on('selection-state-changed', () => this.forceRedraw())
      if (this.gene) this.forceRedraw()
  },
  watch: {
      gene: function () { this.forceRedraw() }
  },
  computed: {
      statusText: function () {
          const labels = this.app.currentSelectionT.map(t => t.label)
          return labels.join(", ") || "."
      },
      featureColor () {
        return this.featureColorMap.getColor(this.gene)
      },
      selectedText: function () {
          return this.app.currentSelectionT.
              filter(t => t.gene === this.myGene).
              map(t => t.label).
              join(", ")
      }
  },
  methods: {
    forceRedraw () {
        this.layout().then(() => {
            this.myGene = this.gene
        })
    },
    //
    getEventObjects (e) {
      const ex = e.target.closest('.exon')
      let feature = this.myGene
      let transcript = null
      let exon = null
      if (ex) {
          const nparts = ex.getAttribute('name').split(".")
          const ei = parseInt(nparts[1])
          if (nparts[0] === "*") {
              transcript = this.myGene.composite
              exon = this.myGene.composite.dExons[ei]
          } else {
              const ti = parseInt(nparts[0])
              transcript = this.myGene.transcripts[ti]
              exon = transcript.exons[ei]
          }
      }
      return {
        feature,
        transcript,
        exon
      }
    },
    //
    mouseoverExon (ev) {
      const o = this.getEventObjects(ev)
      this.$root.$emit('feature-over', {
        region: null,
        feature: o.feature,
        transcript: o.transcript,
        exon: o.exon,
        event: ev })
    },
    mouseoutExon (ev) {
      const o = this.getEventObjects(ev)
      this.$root.$emit('feature-out', {
        region: null,
        feature: o.feature,
        transcript: o.transcript,
        exon: o.exon,
        event: ev })
    },
    clickExon (ev) {
      const o = this.getEventObjects(ev)
      this.$root.$emit('feature-click', {
        region: null,
        feature: o.feature,
        transcript: o.transcript,
        exon: o.exon,
        event: ev,
        preserve: true }) // extra parameter to prevent unselecting anything else
    },
    connectorToTranscripts (e1, e2) {
      if (e1.tExons) {
          const tes = e1.tExons.filter(te1 => {
              const t = te1.transcript
              let v= false
              e2.tExons.forEach(te2 => {
                  const t2 = te2.transcript
                  v = v || (t === t2 && te2.eIndex === te1.eIndex + 1)
              })
              return v
          })
          const ts = Array.from(new Set(tes.map(te => te.transcript)))
          return ts
      } else {
          if (e1.transcript === e2.transcript) {
              return [e1.transcript]
          } else {
              return []
          }
      }
    },
    // given the div representing an exon, return that exon
    getEventConnector (ev) {
      const c = ev.target.closest(".connector")
      const cn = c ? parseInt(c.getAttribute('name')) : -1
      const ctor = cn >= 0 ? this.connectors[cn] : null
      return ctor
    },
    mouseoverConnector (ev) {
        const oc = this.overConnector = this.getEventConnector (ev)
        const overTs = this.connectorToTranscripts(oc.e1, oc.e2)
        this.$root.$emit('feature-over', {
            region: null,
            feature: this.myGene,
            transcript: overTs,
            exon: null,
            event: ev })
    },
    mouseoutConnector () {
        this.overConnector = null
        this.$root.$emit('feature-out', {})
    },
    clickConnector (ev) {
      const c = this.getEventConnector(ev)
      if (!c) return
      let ts
      if (c.e1.transcript) {
          ts = [ c.e1.transcript ]
      } else {
          ts = this.connectorToTranscripts(c.e1, c.e2)
      }
      this.mouseoutConnector()
      this.$root.$emit('feature-click', {
        region: null,
        feature: this.myGene,
        transcript: ts,
        exon: null,
        event: ev,
        preserve: true }) // extra parameter to prevent unselecting anything else
    },
    //
    isOverExon (e) {
        return this.app.cmSetE.has(e)
    },
    //
    // Returns true iff this exon is currently selected.
    isExonSelected (e) {
        if (e.tExons) {
            // distinct exon. Return true if a transcript exon selected 
            return e.tExons.reduce((v,ex) => v || this.app.csSetE.has(ex), false)
        } else if (e.tExon) {
            // CDS part. Return true iff its transcript exon selected
            return this.app.csSetE.has(e.tExon)
        } else {
            // transcript exon
            return this.app.csSetE.has(e)
        }
    },
    // Returns true if e's transcript(s) are in the mouseover set
    isOverTranscript (e) {
        if (e.transcript) return this.app.cmSetT.has(e.transcript)
        if (e.tExons) return e.tExons.reduce((v, te) => v || this.app.cmSetT.has(te.transcript), false)
        return false
    },
    // If e is a transcript exon, returns true iff e.transcript is selected.
    // If e is a distinct exon, returns true iff te.transcipt is selected for any te in e.tExons.
    isTranscriptSelected (e) {
        if (e.transcript) {
            // e is a transcript exon
            return this.app.csSetT.has(e.transcript)
        } else if (e.tExon) {
            // e is a CDS "piece" generated from an exon
            return this.app.csSetT.has(e.tExon.transcript)
        } else {
            // e is a distinct exon
            return e.tExons.reduce((v,te) => {
                return v || this.app.csSetT.has(te.transcript)
            }, false)
        }
    },
    clearSelectedTranscripts (ev) {
        if (! ev.shiftKey) {
            this.$root.$emit('clear-selection', this.myGene)
        }
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
      const seen = new Set()
      const ts = [].concat(this.gene.transcripts).sort((a,b) => b.exons.length - a.exons.length)
      ts.forEach(t => {
          t.exons.forEach(e => {
              if (seen.has(e.de)) return
              seen.add(e.de)
              e.de.y = this.featurePacker.add(null, e.de.start, e.de.end, this.exonHeight)
              maxy = Math.max(maxy, e.de.y)
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
            return this.featureColor
        }
        return this.featureColor
    },
    exonBorderColor (e) {
        if (this.isExonSelected(e) || this.isOverTranscript(e)) {
            return this.selectedColor2
        } else if (this.isTranscriptSelected(e)) {
            return this.selectedColor
        } else {
            return this.featureColor
        }
    },
    exonBorderWidth (e) {
        if (this.isExonSelected(e) || this.isOverExon(e)) {
            return 3
        } else if (this.isTranscriptSelected(e) || this.isOverTranscript(e)) {
            return 1
        } else {
            return 0
        }
    },
    connectorStrokeWidth (ctor) {
        if (ctor === this.overConnector) return 4
        return 2
    },
    connectorColor (ctor) {
        if (ctor === this.overConnector) return this.selectedColor2
        const myTs = this.connectorToTranscripts(ctor.e1, ctor.e2)
        const oh = myTs.reduce((v, t) => v || this.app.cmSetT.has(t), false)
        if (oh) return this.selectedColor2
        const highlighted = myTs.reduce((v,t) => v || this.app.csSetT.has(t), false)
        return highlighted ? this.selectedColor : this.featureColor
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
                    const cc_key = `*.${pde.dIndex}.${cde.dIndex}`
                    if (cc[cc_key]) {
                        return
                    }
                    // Determine color for connector.
                    // const cColor = this.connectorColor(pde, cde)
                    //
                    const pce = pde.composite   // composite exon for d.e. j-1
                    const cce = cde.composite   // composite exon for d.e. j
                    const ctor = {
                        key: cc_key,
                        e1: pde,
                        e2: cde,
                        // color: cColor,
                        segments: []
                        }
                    //
                    if (pce === cce) {
                      // connecting two exons in the same contig. 
                      ctor.segments.push(['C', pde.x+pde.width, pde.y+yAdjust, cde.x, cde.y+yAdjust])
                      this.connectors.push(ctor)
                      cc[cc_key] = ctor
                      return
                    }
                    // Initial horizontal segment from right right end of de to right end of its ce
                    ctor.segments.push(['L', pde.x+pde.width, pde.y+yAdjust, pce.x+pce.width, pde.y+yAdjust])

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
                        pseg = ctor.segments[ctor.segments.length-1]
                        ctor.segments.push(['C', pseg[3], pseg[4], fSkipped.x, y+yAdjust])
                        //
                        pseg = ctor.segments[ctor.segments.length-1]
                        ctor.segments.push(['L', pseg[3], pseg[4], lSkipped.x + lSkipped.width, pseg[4]])
                    }

                    // Curved segment
                    pseg = ctor.segments[ctor.segments.length-1]
                    ctor.segments.push(['C', pseg[3], pseg[4], cce.x, cde.y+yAdjust])

                    // Final horizontal segment
                    pseg = ctor.segments[ctor.segments.length-1]
                    ctor.segments.push(['L', pseg[3], pseg[4], cde.x, cde.y+yAdjust])

                    // The list of segments is the new connector. Add it to the list.
                    this.connectors.push(ctor)
                    // Cache it
                    cc[cc_key] = ctor
                })
            })

        } else {
            this.connectors = []
            // one transcript per line - add one connector per transcript from first exon to last
            this.connectors = this.gene.transcripts.map((t,j) => {
                const e1 = t.exons[0]
                const e2 = t.exons[t.exons.length - 1]
                const ckey = `${j}.${e1.eIndex}.${e2.eIndex}`
                const y = j * (this.exonHeight+this.vertGap) + this.exonHeight / 2
                // const cColor = this.connectorColor(e1, e2)
                return {
                    key:ckey,
                    e1: e1,
                    e2: e2,
                    // color:cColor,
                    segments: [['L', e1.x + 2, y, e2.x + e2.width - 2, y ]]}
            })
            this.connectorCache = {}
        }
    },
    drawConnector (ctor) {
        const path = ctor.segments.reduce((p,seg) => {
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
    },
    clickCart () {
        const descs = this.myGene.transcripts.map(t => {
            if (! this.app.csSetT.has(t)) return null
            return this.dataManager().makeSequenceDescriptor('transcript', this.myGene, t)
        }).filter(x => x)
        this.$root.$emit("sequence-selected", { sequences : descs, unselectAll : true })
    }
  }
})
</script>

<style scoped>
.gene-view {
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
}
.disabled, .disabled * {
    color: gray;
    pointer-events: none;
}
.title {
    text-align: left;
    background-color: #bbb;
}
.start-codon,
.stop-codon {
    pointer-events: none;
}
</style>
