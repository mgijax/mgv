<template>
  <g transform="translate(0,0)" class="zoom-region">
  <svg
    @mouseover.stop="mouseover"
    @mouseout.stop="mouseout"
    @mousemove="mousemove"
    @mouseleave.stop="mouseleave"
    @click="clicked"
    @dblclick="dblClicked"
    :width="width"
    >
    <g
      :transform="`translate(${regionScrollDelta},${zeroOffset})`"
      >
      <!-- ======= current range box ======= -->
      <g
        v-if="(dragging || trackMouse) && currRange"
        >
        <text
          :x="(currRange[0] + currRange[1]) / 2"
          :y="-zeroOffset + Math.max(height, 10) + 12"
          font-size="10"
          text-anchor="middle"
          >
          {{chr.name}}:{{p2b(currRange[0])}}{{currRange[0] !== currRange[1] ? '..' + p2b(currRange[1]) : ''}}
          </text>
        <rect
          :x="Math.min(currRange[0], currRange[1])"
          :y="-zeroOffset"
          :width="Math.abs(currRange[1] - currRange[0]) + 1"
          :height="Math.max(height, 10)"
          fill-opacity="0.3"
          stroke="black"
          stroke-opacity="0.5"
          />
      </g>
      <!-- ======= underlay ======= -->
      <rect
        x=0
        :y="-zeroOffset"
        width="100%"
        :height="Math.max(height, 20)"
        :fill="ori === '-' ? 'red' : 'white'"
        opacity="0.3"
        class="underlay"
        ref="underlay"
        :transform="`translate(${-regionScrollDelta},0)`"
        />
      <!-- ======= axis line ======= -->
      <line
        class="axis"
        :x1="b2p(start)"
        :y1="0"
        :x2="b2p(end)"
        :y2="0"
        stroke="black"
        :transform="`translate(${-regionScrollDelta},0)`"
        />
      <!-- ======= label ======= -->
      <text
        x="50%"
        :y="height - zeroOffset"
        text-align="center"
        alignment-baseline="hanging"
        fill="black"
        font-size="10px"
        :transform="`translate(${-regionScrollDelta},0)`"
        >{{chr.name}}:{{start + deltaB}}..{{end + deltaB}}</text>
      <!-- ======= sequence ======= -->
      <text
        v-if="showSequence"
        :font-size="featureFontSize"
        fill=black
        stroke=none
        >
        <tspan
          v-for="(b,i) in sequence"
          :key="i"
          :x="b2p(seqStart + i)"
          :fill="baseColor(b)"
          >{{b}}</tspan>
      </text>
      <!-- ======= Features ======= -->
      <g
         v-for="f in features"
        :key="f.ID"
        :name="f.ID"
        :canonical="f.cID"
        class="feature"
        :class="{ highlight: featureHighlighted(f) || featureSelected(f) }"
        :transform="featureTransform(f)"
        v-show="featureVisible(f)"
        >
        <rect
          class="outline"
          :x="featureX(f)"
          :y="0"
          :height="featureH(f)"
          :width="featureW(f)"
          :style="featureStyle(f)"
          :fill-opacity="showDetails ? 0.3 : 1"
          />
        <!-- ======= Transcripts ======= -->
        <g
          v-if="showDetails"
          v-for="(t, ti) in f.transcripts"
          :key="t.ID"
          class="transcript"
          :transform="transcriptTransform(f, t, ti)"
          >
          <polyline
            :points="transcriptAxisPoints(f, t, ti)"
            :stroke="featureColor(f)"
            fill="none"
            />
          <!-- ======= Exons ======= -->
          <rect v-for="e in t.exons"
            :key="e.ID"
            class="exon"
            :x="featureX(e)"
            :y="0"
            :width="featureW(e)"
            :height="featureHeight"
            :fill="featureColor(f)"
            stroke="none"
            />
          <!-- transcript label -->
          <text
            v-if="spreadTranscripts && showDetails && showTranscriptLabels"
            :x="transcriptTextX(t)"
            :y="featureHeight"
            :font-size="transcriptFontSize"
            alignment-baseline="hanging"
            >{{t.tID}}</text>
        </g>
        <text
          class="symbol"
          v-if="(showDetails && showFeatureLabels) || featureSelected(f) || featureHighlighted(f)"
          :x="featureTextX(f)"
          :y="0"
          :font-size="featureFontSize"
          :style="{
            textAnchor: 'middle',
            fontFamily: 'sans-serif',
            fontWeight: featureHighlighted(f) ? 'bold' : 'normal'
          }"
          >
          {{f.symbol || f.ID}}
          </text>
      </g> <!-- features -->
    <!--
    -->
  </g>
  </svg>
  </g>
</template>

<script>
import MComponent from '@/components/MComponent'
import MBrush from '@/components/MBrush'
import u from '@/lib/utils'
import { TextSpreader } from '@/lib/Layout'
//
document.body.addEventListener('keydown', function (e) {
  if (e.code === 'Tab') {
    console.log('keydown', e)
  }
})
document.body.addEventListener('keyup', function (e) {
  if (e.code === 'Tab') {
    console.log('keyup', e)
  }
})
//
export default MComponent({
  name: 'ZoomRegion',
  components: { MBrush },
  inject: ['featureColorMap', 'getFacets'],
  props: {
    // the app context
    context: {
      type: Object,
      default: function () {
        return {}
      }
    },
    // my genome
    genome: {
      type: Object,
      default: function () { return { name: '?' } }
    },
    // my chromosome
    chr: {
      type: Object,
      default: function () { return { name: '?' } }
    },
    // my start coordinate
    start: {
      type: Number,
      default: 1
    },
    // my end coordinate
    end: {
      type: Number,
      default: 1000000
    },
    //
    regionScrollDelta: {
      type: Number,
      default: 0
    },
    // orientation
    ori: {
      type: String,
      default: '+'
    },
    //
    allMaxLaneP: {
      type: Number,
      default: 0
    },
    //
    allMaxLaneM: {
      type: Number,
      default: 0
    },
    // amount by which to pad the rendered region
    pad: {
      type: Number,
      default: 0.5
    },
    // Width to make myself, in px
    width: {
      type: Number,
      default: 350
    }
  },
  data: function () {
    return {
      features: [],
      sequence: '',
      seqStart: 0,
      dragging: false,
      currRange: null,
      busy: false
    }
  },
  computed: {
    detailThreshold: function () {
      return Math.min(this.cfg.detailThreshold, this.cfg.detailThresholdLimit)
    },
    sequenceThreshold: function () {
      return Math.min(this.cfg.sequenceThreshold, this.cfg.sequenceThresholdLimit)
    },
    trackMouse: function () {
      return this.cfg.trackMouse
    },
    spreadTranscripts: function () {
      return this.cfg.spreadTranscripts
    },
    showFeatureLabels: function () {
      return this.cfg.showFeatureLabels
    },
    showTranscriptLabels: function () {
      return this.cfg.showTranscriptLabels
    },
    showDetails: function () {
      return (this.context.coords.end - this.context.coords.start + 1) < this.detailThreshold
    },
    showSequence: function () {
      return (this.end - this.start + 1) < this.sequenceThreshold
    },
    featureHeight: function () {
      return parseInt(this.cfg.featureHeight)
    },
    laneGap: function () {
      return parseInt(this.cfg.laneGap)
    },
    featureFontSize: function () {
      return parseInt(this.cfg.featureFontSize)
    },
    transcriptFontSize: function () {
      return parseInt(this.cfg.transcriptFontSize)
    },
    // context string. watch for changes to feature range
    cxtString: function () {
      return `${this.genome.name}:${this.chr.name}:${this.start}:${this.end}:${this.pad}`
    },
    //
    baseFontSize: function () {
      return this.ppb < 1 ? 4 : this.ppb < 14 ? this.ppb + 4 : 18
    },
    //
    selectedSet: function () {
      return new Set(this.context.currentSelection)
    },
    //
    fIndex: function () {
      return u.index(this.features, 'ID')
    },
    // pixels per base
    ppb: function () { return this.width / (this.end - this.start + 1) },
    // bases per pixel
    bpp: function () { return 1 / this.ppb },
    //
    deltaB: function () { return -Math.round(this.regionScrollDelta / this.ppb) },
    //
    maxLaneP: function () {
      if (this.showDetails && this.spreadTranscripts) {
        return 0
      } else {
        let x = this.features.filter(f => f.strand === '+').reduce((v, f) => Math.max(v, f.lane), 0)
        return x
      }
    },
    maxLaneM: function () {
      if (this.showDetails && this.spreadTranscripts) {
        return this.features.reduce((v, f) => Math.max(v, f.lane2 + f.tCount), 0)
      } else {
        return this.features.filter(f => f.strand === '-').reduce((v, f) => Math.max(v, f.lane), 0)
      }
    },
    height: function () {
      let h = (this.allMaxLaneP + this.allMaxLaneM) * (this.featureHeight + this.laneGap) + this.laneGap
      return h
    },
    zeroOffset: function () {
      return this.allMaxLaneP * (this.featureHeight + this.laneGap) + Math.max(this.laneGap, 10)
    }
  },
  watch: {
    cxtString: function (newval, oldval) {
      if (newval !== oldval) this.getFeatures()
    },
    spreadTranscripts: function () {
      this.$nextTick(() => this.$emit('region-draw', this))
    },
    height: function () {
      this.$nextTick(() => this.$emit('region-draw', this))
    },
    width: function () {
    }
  },
  mounted: function () {
    this.textSpreader = new TextSpreader()
    this.initDrag()
    this.getFeatures()
  },
  updated: function () {
    this.spreadText()
  },
  methods: {
    baseColor: function (b) {
      return this.cfg.baseColors[b] || 'black'
    },
    spreadText: function () {
      // get all the symbols (text nodes) in my region
      let symbols = this.$el.querySelectorAll('.feature .symbol')
      // get each symbol's bounding rect. Partition into lists at the same y-coordinate
      let y2rects = {}
      symbols.forEach(t => {
        let x = parseFloat(t.getAttribute('x'))
        let r = t.getBoundingClientRect()
        if (!(r.y in y2rects)) y2rects[r.y] = []
        y2rects[r.y].push({text: t, rect: { width: r.width, x: x }})
      })
      // spread text within each tier
      for (let y in y2rects) {
        let rects = y2rects[y]
        rects.sort((a, b) => a.rect.x - b.rect.x)
        let rs = rects.map(r => r.rect)
        this.textSpreader.spread(rs)
        rs.forEach((r, i) => {
          let t = rects[i].text
          t.setAttribute('x', r.x)
        })
      }
    },
    // converts a pixel position (0-based, within the region) to base position
    p2b (p) {
      return Math.floor(this.start + this.bpp * p)
    },
    // converts a base position to a pixel position
    b2p (b) {
      return this.ppb * (b - this.start)
    },
    featureX (f) {
      return this.b2p(f.start)
    },
    featureW (f) {
      return Math.max(1, (f.end - f.start + 1) * this.ppb)
    },
    featureY (f) {
      if (this.showDetails && this.spreadTranscripts) {
        return f.lane2 * (this.featureHeight + this.laneGap) + this.laneGap
      } else if (f.strand === '+') {
        return -f.lane * (this.featureHeight + this.laneGap)
      } else {
        return (f.lane - 1) * (this.featureHeight + this.laneGap) + this.laneGap
      }
    },
    featureH (f) {
      if (this.showDetails && this.spreadTranscripts) {
        let tc = Math.max(f.tCount, 1)
        return this.featureHeight * tc + this.laneGap * (tc - 1)
      } else {
        return this.featureHeight
      }
    },
    featureTransform (f) {
      let y = this.featureY(f)
      return `translate(0, ${y})`
    },
    featureColor (f) {
      return this.featureColorMap.getColor(f)
    },
    featureHighlighted: function (f) {
      let c = this.context.currentMouseover
      return c && (c.ID === f.ID || (c.cID && c.cID === f.cID))
    },
    featureSelected: function (f) {
      return this.selectedSet.has(f.cID) || this.selectedSet.has(f.ID)
    },
    featureVisible: function (f) {
      let overlaps = f.start <= (this.end + this.deltaB) && f.end >= (this.start + this.deltaB)
      return overlaps && this.getFacets().test(f)
    },
    featureTextX: function (f) {
      let s = Math.max(f.start, this.start + this.deltaB)
      let e = Math.min(f.end, this.end + this.deltaB)
      return this.b2p((s + e) / 2)
    },
    featureStyle (f) {
      let fill = this.featureColor(f)
      let stroke = 'none'
      let strokeWidth = 1
      let strokeOpacity = 1
      if (this.featureSelected(f)) {
        strokeWidth = this.cfg.selectedFeature.strokeWidth
        stroke = this.cfg.selectedFeature.stroke
      }
      if (this.featureHighlighted(f)) {
        strokeWidth = this.cfg.currentFeature.strokeWidth
        stroke = this.cfg.currentFeature.stroke
      }
      return { fill, stroke, strokeWidth, strokeOpacity }
    },
    transcriptX1 (t) {
      return this.b2p(Math.min.apply(null, t.exons.map(e => e.start)))
    },
    transcriptX2 (t) {
      return this.b2p(Math.max.apply(null, t.exons.map(e => e.end)))
    },
    transcriptTextX: function (t) {
      let s = Math.max(t.exons[0].start, this.start + this.deltaB)
      return this.b2p(s)
    },
    transcriptTransform (f, t, ti) {
      let y = this.spreadTranscripts ? ti * (this.featureHeight + this.laneGap) : 0
      return `translate(0, ${y})`
    },
    transcriptY (f, t, i) {
      if (this.spreadTranscripts) {
        return this.featureY(f) + i * (this.featureHeight + this.laneGap)
      } else {
        return this.featureY(f)
      }
    },
    transcriptAxisPoints (f, t, ti) {
      let y = this.transcriptY(f, t, ti) + this.featureHeight / 2
      y = this.featureHeight / 2
      let x1 = this.transcriptX1(t)
      let x2 = this.transcriptX2(t)
      let ext = 10
      let h = 3
      if (!this.spreadTranscripts) {
        return `${x1} ${y} ${x2} ${y}`
      }
      if (f.strand === '+') {
        x2 += ext
        return `${x1} ${y} ${x2} ${y} ${x2 - ext / 2} ${y - h} ${x2} ${y} ${x2 - ext / 2} ${y + h}`
      } else {
        x1 = x2
        x2 = this.transcriptX1(t) - ext
        return `${x1} ${y} ${x2} ${y} ${x2 + ext / 2} ${y - h} ${x2} ${y} ${x2 + ext / 2} ${y + h}`
      }
    },
    // Request features in my range, which will asynchromously cause a redraw.
    getFeatures () {
      //
      let delta = Math.round((this.end - this.start + 1) / 2)
      this.seqStart = this.start
      this.busy = true
      this.$emit('busy-start')
      this.dataManager.getFeatures(this.genome, this.chr, this.start - delta, this.end + delta).then(feats => {
        this.busy = false
        if (this.showDetails) {
          this.dataManager.getModels(this.genome, this.chr, this.start, this.end).then(models => {
            let ix = u.index(models, 'gID')
            feats.forEach(f => {
              if (f.tCount === f.transcripts.length) return
              let ts = ix[f.ID]
              ts && ts.transcripts.forEach(t => f.transcripts.push(t))
            })
            this.features = feats
            this.nextTick(() => this.$emit('region-draw', this))
            this.$emit('busy-end')
          })
        } else {
          this.features = feats
          this.nextTick(() => this.$emit('region-draw', this))
          this.$emit('busy-end')
        }
        if (this.showSequence) {
          this.$emit('busy-start')
          this.dataManager.getSequence(this.genome, this.chr, this.start, this.end).then(data => {
            this.seqStart = data.start
            this.sequence = data.seq
            this.$emit('busy-end')
          })
        } else {
          this.sequence = ''
        }
      })
    },
    getEventFeature (e) {
      let f = e.target.closest('.feature')
      if (!f) return
      let fid = f.getAttribute('name')
      let feat = this.fIndex[fid]
      return feat
    },
    mousemove: function (e) {
      if (this.dragging) return
      let bb = this.$refs.underlay.getBoundingClientRect()
      let px = e.clientX - bb.x
      this.currRange = [px, px]
    },
    mouseleave: function (e) {
      if (this.dragging) return
      this.currRange = null
    },
    mouseover: function (e) {
      let f = this.getEventFeature(e)
      if (f) this.$root.$emit('feature-over', { feature: f, event: e })
    },
    mouseout: function (e) {
      let f = this.getEventFeature(e)
      if (f) this.$root.$emit('feature-out', { feature: f, event: e })
    },
    clicked: function (e) {
      let f = this.getEventFeature(e)
      if (f) {
        this.$root.$emit('feature-click', { feature: f, event: e })
        e.stopPropagation()
      } else if (this.absorbNextClick) {
        e.stopPropagation()
      }
      this.absorbNextClick = false
    },
    dblClicked: function (e) {
      let f = this.getEventFeature(e)
      if (f) {
        this.$root.$emit('feature-dblclick', { feature: f, event: e })
        e.stopPropagation()
      }
    },
    initDrag () {
      this.dragging = false
      // For lockstep dragging across regions, broadcast the drag deltas
      u.dragify(this.$el, {
        dragstart: function (e, d) {
          // if here because user clicked on a feature, cancel the drag
          if (e.target.closest('.feature')) return false
          this.dragging = true
          this.dragData = d
          d.dragged = false
          d.bb = this.$el.getBoundingClientRect()
          d.shiftDrag = e.shiftKey
        },
        drag: function (e, d) {
          d.dragged = true
          if (d.shiftDrag) {
            let x1 = d.startX - d.bb.x
            let x2 = e.clientX - d.bb.x
            this.currRange = [x1, x2]
          } else {
            this.$root.$emit('region-drag', d.deltaX)
          }
        },
        dragend: function (e, d) {
          if (!d.dragged) {
            // this was actually just a click
            this.$root.$emit('context', { currentSelection: [] })
            this.dragData = null
            this.dragging = false
            return
          }
          let nc
          if (d.shiftDrag) {
            // zoom
            let b1 = Math.floor(this.start + this.currRange[0] / this.ppb)
            let b2 = Math.floor(this.start + this.currRange[1] / this.ppb)
            nc = {
              ref: this.genome.name,
              chr: this.chr,
              start: Math.min(b1, b2),
              end: Math.max(b1, b2)
            }
          } else {
            // pan
            if (this.context.lcoords.landmark) {
              nc = {
                ref: this.genome.name,
                delta: this.context.lcoords.delta + this.deltaB
              }
            } else {
              nc = {
                ref: this.genome.name,
                chr: this.chr,
                start: this.start + this.deltaB,
                end: this.end + this.deltaB
              }
            }
            let cr = this.currRange
            this.currRange = [ cr[0] + this.deltaB, cr[1] + this.deltaB ]
          }
          //
          this.$root.$emit('context', nc)
          this.$root.$emit('region-dragend', 0)
          //
          // for some reason, a click event is fired at mouseup, even though dragify handlers call
          // stopPropagation and preventDefault. So here we just set a little flag for ourselves to ignore
          // the next click event (see method clicked() above).
          this.absorbNextClick = true
          this.dragData = null
          this.dragging = false
          this.currRange = null
        }
      }, this.$root.$el, this)
    }
  }
})
</script>

<style>
.zoom-region .underlay {
  transition: height 0.5s;
}
.zoom-region > svg > text {
  transition: y 0.5s;
}
.feature .transcript {
  transition: transform 0.5s;
}
</style>
