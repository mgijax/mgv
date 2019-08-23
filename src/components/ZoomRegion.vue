<template>
  <g
    class="zoom-region"
    :class="{ current: isCurrent, dragging: dragging || rDragging }"
    :transform="`translate(${region.deltaX + regionDragDelta}, 0)`"
    >
  <svg
    @mouseover.stop="mouseover"
    @mouseout.stop="mouseout"
    @mousemove="mousemove"
    @mouseenter.stop="mouseenter"
    @mouseleave.stop="mouseleave"
    @click="clicked"
    :width="region.width"
    >
    <g
      :transform="`translate(${myDelta},${zeroOffset})`"
      >
      <!-- ======= synteny blocks ======= -->
      <g class="sblocks">
        <rect
         v-for="(b,i) in blocks"
         :key="i"
         :x="b2p(b.start)"
         :y="-zeroOffset"
         :width="b2p(b.end) - b2p(b.start)"
         :height="Math.max(height, 20)"
         :fill="b.ori === '-' ? 'red' : 'white'"
         opacity="0.2"
         />
      </g>
      <!-- ======= axis line ======= -->
      <line
        class="axis"
        :x1="b2p(region.start)"
        :y1="0"
        :x2="b2p(region.end)"
        :y2="0"
        stroke="black"
        stroke-opacity="0.3"
        :transform="`translate(${-myDelta},0)`"
        v-show="!spreadTranscripts || !showDetails"
        />
      <!-- ======= tick marks ======= -->
      <g class="tickmarks">
        <g
          v-for="(x,ti) in tickPositions"
          :key="ti"
          >
          <line
            class="tick"
            :x1="x.px"
            :y1="-zeroOffset"
            :x2="x.px"
            :y2="-zeroOffset + Math.max(height, 10)"
            stroke="black"
            stroke-opacity="0.1"
            />
          <text
            :x="x.px"
            :y="height - zeroOffset + 8"
            font-family="sans-serif"
            font-size="8px"
            fill="black"
            >{{x.label}}</text>
        </g>
      </g>
      <!-- ======= left end underlay, shows when you scroll past the beginning of the chr  ======= -->
      <rect
        v-if="region.start - (region.end - region.start) < 0"
        :x="b2p(-region.chr.length)"
        :y="-zeroOffset"
        :width="b2p(0) - b2p(-region.chr.length)"
        :height="Math.max(height, 20)"
        fill="gray"
        />
      <!-- ======= right end underlay, shows when you scroll past the end of the chr  ======= -->
      <rect
        :x="b2p(region.chr.length)"
        :y="-zeroOffset"
        :width="b2p(region.chr.length)"
        :height="Math.max(height, 20)"
        fill="gray"
        />
      <!-- ======= underlay ======= -->
      <rect
        x=0
        :y="-zeroOffset"
        width="100%"
        :height="Math.max(height, 20)"
        fill="white"
        fill-opacity="0"
        stroke="black"
        :stroke-opacity="isCurrent ? 1.0 : 0.5"
        class="underlay"
        ref="underlay"
        :transform="`translate(${-myDelta},0)`"
        />
      <!-- ======= current range box ======= -->
      <g
        v-if="(dragging || trackMouse) && currRange"
        >
        <rect
          :x="currRangeTextX - (currRange[0] !== currRange[1] ? 55 : 30)"
          :y="-zeroOffset + Math.max(height, 10) + 2"
          :width="currRange[0] !== currRange[1] ? 110 : 60"
          height="10"
          fill="white"
          />
        <text
          :x="currRangeTextX"
          :y="-zeroOffset + Math.max(height, 10) + 10"
          font-size="10"
          font-family="sans-serif"
          :text-anchor="currRangeAnchor"
          >
          {{region.chr.name}}:{{p2b(currRange[0])}}{{currRange[0] !== currRange[1] ? '..' + p2b(currRange[1]) : ''}}
          </text>
        <rect
          :x="b2p(0.5 + p2b(Math.min(currRange[0], currRange[1])))"
          :y="-zeroOffset"
          :width="ppb * Math.floor(bpp * Math.abs(currRange[1] - currRange[0])) + 1"
          :height="Math.max(height, 10)"
          fill-opacity="0.3"
          stroke="black"
          stroke-opacity="0.5"
          />
      </g>
      <!-- ======= coordinates label ======= -->
      <text
        x="50%"
        :y="height - zeroOffset + 10"
        dominant-baseline="hanging"
        fill="black"
        font-size="10px"
        font-family="sans-serif"
        :font-weight="isCurrent ? 'bold' : 'normal'"
        :transform="`translate(${-myDelta},0)`"
        >{{coordinatesLabel}}</text>
      <!-- ======= sequence string ======= -->
      <text
        v-if="showSequence"
        :y="-sequenceFontSize"
        :font-size="sequenceFontSize"
        fill=black
        stroke=none
        >
        <!-- forward strand -->
        <tspan
          v-for="(b,i) in sequence"
          :key="i"
          :x="b2p(seqStart + i + 1.5)"
          :fill="baseColor(b)"
          text-anchor="middle"
          >{{b}}</tspan>
        <!-- reverse strand -->
        <tspan
          v-for="(b,i) in scomplement"
          :key="-i-1"
          :x="b2p(seqStart + i + 1.5)"
          :y="0"
          :fill="baseColor(b)"
          text-anchor="middle"
          >{{b}}</tspan>
        <tspan
          v-if="!sequence"
          x="25"
          fill="black"
          >No sequence available.</tspan>
      </text>
      <!-- ======= Features ======= -->
      <g
         v-for="f in features"
        :key="f.ID"
        :name="f.ID"
        :canonical="f.cID"
	:strand="f.strand"
        class="feature"
        :class="{ highlight: featureHighlighted(f), visible: featureVisible(f)}"
        :transform="featureTransform(f)"
        :style="{ opacity: featureOpacity(f) }"
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
          class="transcripts"
          >
        <g
          class="transcript"
          v-for="(t, ti) in spreadTranscripts ? f.transcripts : f.composite.exons ? [f.composite] : []"
          :key="t.ID"
          :name="t.ID"
          :transform="transcriptTransform(f, t, ti)"
          >
          <!-- ======= Underlay  ======= -->
          <rect
            class="underlay"
            :x="featureX(t)"
            :y="0"
            :width="featureW(t)"
            :height="featureH(t)"
            fill="white"
            :fill-opacity="spreadTranscripts ? (transcriptHighlighted(t) ? 0.6 : 0.2) : 0"
            />
          <!-- ======= Transcript axis line, arrow ======= -->
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
          <!-- ======= Start codon ======= -->
          <path v-if="t.cds && showStartStopCodons"
            :d="codonGlyph(f, t, 'start')"
            :fill="'cyan'"
            stroke="cyan"
            stroke-width="0.5"
            :transform="`translate(0,${spreadTranscripts ? 4 + featureHeight/2 : 0})`"
            />
          <!-- ======= Stop codon ======= -->
          <path v-if="t.cds && showStartStopCodons"
            :d="codonGlyph(f, t, 'stop')"
            :fill="'red'"
            stroke="red"
            stroke-width="0.5"
            :transform="`translate(0,${spreadTranscripts ? featureHeight/2 : 0})`"
            />
        </g>
        <g
          class="transcript"
          v-for="(t, ti) in spreadTranscripts ? f.transcripts : f.composite.exons ? [f.composite] : []"
          :key="t.ID+'.lbl'"
          :transform="transcriptTransform(f, t, ti)"
          >
          <!-- transcript label -->
          <text
            v-if="spreadTranscripts && showDetails && (showTranscriptLabels || transcriptHighlighted(t))"
            :x="transcriptTextX(t)"
            :y="featureHeight + 2"
            :font-weight="t.cds ? 'bold' : 'normal'"
            font-family="sans-serif"
            :font-size="transcriptFontSize"
            dominant-baseline="hanging"
            >{{t.cds ? t.cds.ID : t.ID}}</text>
        </g>
        </g> <!-- if showDetails -->
        <!-- feature label -->
        <text
          class="symbol"
          v-if="(showDetails && showFeatureLabels) || featureSelected(f) || featureMouseover(f) || featureInList(f)"
          :x="featureTextX(f)"
          :x0="featureTextX(f)"
          :y="0"
          :font-size="featureFontSize"
          :style="{
            textAnchor: 'start',
            fontFamily: 'sans-serif',
            fontWeight: featureMouseover(f) ? 'bold' : 'normal'
          }"
          ><tspan
            v-if="featureInList(f)"
            :fill="context.currentList.color"
            stroke="black"
            :font-size="2*featureFontSize"
            :dy="0.3 * featureFontSize"
            >•</tspan><tspan
            :dy="featureInList(f) ? -0.3 * featureFontSize : 0"
            >{{f.symbol || f.ID}}</tspan></text>
      </g> <!-- feature -->
    <!-- Region delete button -->
    <g
      class="zrBtn delete"
      @click.stop="remove"
      @mousedown.stop=""
      >
      <rect
        :x="region.width - 10"
        :y="-zeroOffset"
        width="10"
        height="16"
        fill="black"
        fill-opacity="0"
        />
      <text
        :x="region.width"
        :y="-zeroOffset"
        fill="white"
        fill-opacity=0
        dominant-baseline="hanging"
        text-anchor="end"
        >X</text>
     </g>
    <!-- Region drag button -->
    <g
      class="zrBtn drag"
      ref="draghandle"
      >
      <rect
        :x="2"
        :y="-zeroOffset"
        width="10"
        height="16"
        fill="black"
        fill-opacity="0"
        />
      <text
        :x="2"
        :y="-zeroOffset"
        fill="white"
        fill-opacity=0
        dominant-baseline="hanging"
        >::</text>
     </g>
  </g>
  </svg>
  </g>
</template>

<script>
import MComponent from '@/components/MComponent'
import u from '@/lib/utils'
import { SegmentLayout } from '@/lib/Layout'
import { complement } from '@/lib/genetic_code'
//
export default MComponent({
  name: 'ZoomRegion',
  inject: [
    'dataManager',
    'featureColorMap',
    'getFacets',
    'translator'
  ],
  props: {
    // the app context
    context: {
      type: Object,
      default: function () {
        return {}
      }
    },
    globalScrollDelta: {
      type: Number,
      default: 0
    },
    region: {   // region == { genome, chr, start, end, width }
      type: Object,
      default: null
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
    // if specified, show synteny blocks vs this genome
    synGenome: {
      type: Object,
      default: null
    }
  },
  data: function () {
    return {
      features: [], // the features to draw
      blocks: [], // the synteny blocks to draw
      sequence: '', // the sequence to display
      seqStart: 0,
      busy: false,
      currRange: null,
      dragging: false, // true while dragging within a region
      rDragging: false, // true while dragging region within its strip
      regionScrollDelta: 0, // while a region is being scrolled, the scroll amount (in px)
      regionDragDelta: 0 // while a region is being moved, the drag amount (in px)
    }
  },
  computed: {
    coordinatesLabel: function () {
      const r = this.region
      const c = r.chr.name
      const s = u.prettyPrintBases(r.start + this.deltaB, true)
      const e = u.prettyPrintBases(r.end + this.deltaB, true)
      return `${c}:${s}..${e}`
    },
    tickPositions: function () {
      const r = this.region
      const nticks = Math.floor(r.width / 20)
      const l = r.end - r.start + 1
      const bounds = u.niceBounds(r.start - l/2, r.end + l/2, nticks)
      const ticks = []
      for (let x = bounds.min; x <= bounds.max; x += bounds.steps) ticks.push(x)
      return ticks.map((x,i) => {
        return {
          label: i%2 ? '' : u.prettyPrintBases(x, true),
          px: this.b2p(x)
        }
      })
    },
    isCurrent: function () {
      return this.region === this.context.currRegion
    },
    scomplement: function () {
      return complement(this.sequence)
    },
    myDelta: function () {
      return this.regionScrollDelta
    },
    detailThreshold: function () {
      return Math.min(this.cfg.detailThreshold, this.cfg.detailThresholdLimit)
    },
    sequenceThreshold: function () {
      return Math.min(this.cfg.sequenceThreshold, this.cfg.sequenceThresholdLimit)
    },
    trackMouse: function () {
      return this.cfg.trackMouse
    },
    currRangeAnchor: function () {
      if (this.currRangeTextX < 25) return 'start'
      else if (this.region.width - this.currRangeTextX < 25) return 'end'
      else return 'middle'
    },
    currRangeTextX: function () {
      if (!this.currRange) return 0
      return (this.currRange[0] + this.currRange[1]) / 2
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
      return (this.region.end - this.region.start + 1) < this.detailThreshold
      // return (this.context.coords.end - this.context.coords.start + 1) < this.detailThreshold
    },
    showSequence: function () {
      return this.ppb >= 1
    },
    showStartStopCodons: function () {
      return this.cfg.showStartStopCodons
    },
    featureHeight: function () {
      return parseInt(this.cfg.featureHeight)
    },
    laneGap: function () {
      return parseInt(this.cfg.laneGap) + this.transcriptFontSize
    },
    featureFontSize: function () {
      return parseInt(this.cfg.featureFontSize)
    },
    transcriptFontSize: function () {
      return parseInt(this.cfg.transcriptFontSize)
    },
    sequenceFontSize: function () {
      return parseInt(this.cfg.sequenceFontSize)
    },
    // context string. watch for changes to feature range
    cxtString: function () {
      return `${this.region.genome.name}:${this.region.chr.name}:${this.region.start}:${this.region.end}:${this.pad}`
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
    ppb: function () {
      const v = this.region.width / (this.region.end - this.region.start + 1)
      return v
    },
    // bases per pixel
    bpp: function () {
      return 1 / this.ppb
    },
    //
    deltaB: function () {
      return -Math.round(this.myDelta / this.ppb)
    },
    //
    maxLaneP: function () {
      if (this.showDetails && this.spreadTranscripts) {
        return 1
      } else {
        let x = this.features.filter(f => f.strand === '+' && this.featureVisible(f)).reduce((v, f) => Math.max(v, f.layout.l1), 0)
        return x
      }
    },
    maxLaneM: function () {
      if (this.showDetails && this.spreadTranscripts) {
        return this.features.filter(f => this.featureVisible(f)).reduce((v, f) => Math.max(v, f.layout.l2 + f.transcripts.length), 0)
      } else {
        return this.features.filter(f => f.strand === '-' && this.featureVisible(f)).reduce((v, f) => Math.max(v, f.layout.l1), 0)
      }
    },
    height: function () {
      let h = (this.allMaxLaneP + this.allMaxLaneM) * (this.featureHeight + this.laneGap) + 2 * this.laneGap + 4
      return Math.max(h, this.cfg.minHeight)
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
    showDetails: function(newval, oldval) {
      if (newval !== oldval) {
        this.$nextTick(() => this.$emit('region-draw', this))
      }
    }
  },
  methods: {
    clientXtoBase: function (x) {  
      const rx = this.$refs.underlay.getBoundingClientRect().left
      const baseOffset = (x - rx) * this.bpp
      const pos = Math.round(this.region.start + baseOffset)
      return pos
    },
    remove: function () {
      this.$root.$emit('region-change', { region: this.region, op: 'remove' })
    },
    baseColor: function (b) {
      return this.cfg.baseColors[b] || 'black'
    },
    // converts a pixel position (0-based, within the region) to base position
    p2b (p) {
      return Math.floor(this.region.start + this.bpp * p)
    },
    // converts a base position to a pixel position
    b2p (b) {
      const v = this.ppb * (b - this.region.start)
      return v
    },
    featureX (f) {
      return this.b2p(f.start)
    },
    featureW (f) {
      return Math.max(1, (f.end - f.start + 1) * this.ppb)
    },
    featureY (f) {
      if (this.showDetails && this.spreadTranscripts) {
        return f.layout.l2 * (this.featureHeight + this.laneGap) + this.laneGap
      } else if (f.strand === '+') {
        return -f.layout.l1 * (this.featureHeight + this.laneGap)
      } else {
        return (f.layout.l1 - 1) * (this.featureHeight + this.laneGap) + this.laneGap
      }
    },
    featureH (f) {
      if (this.showDetails && this.spreadTranscripts && f.transcripts) {
        let tc = Math.max(f.transcripts.length, 1)
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
    featureOpacity (f) {
      const nobodyHighlighted = !(this.context.currentMouseover || this.selectedSet.size || this.context.currentListSet)
      if (nobodyHighlighted) return 1
      return this.featureHighlighted(f) ? 1 : 1 - this.cfg.contrast
    },
    featureHighlighted: function (f) {
      return this.featureMouseover(f) || this.featureSelected(f) || this.featureInList(f)
    },
    featureMouseover: function (f) {
      let c = this.context.currentMouseover
      return c && (c.ID === f.ID || (c.cID && c.cID === f.cID))
    },
    transcriptHighlighted: function (t) {
      return t === this.context.currentMouseoverT
    },
    featureSelected: function (f) {
      return this.selectedSet.has(f.cID) || this.selectedSet.has(f.ID)
    },
    featureInList: function (f) {
      if (!this.context.currentList) return false
      const s = this.context.currentListSet
      return s && (s.has(f.cID) || s.has(f.ID))
    },
    featureVisible: function (f) {
      let overlaps = f.start <= (this.region.end + this.deltaB) && f.end >= (this.region.start + this.deltaB)
      //return overlaps && this.getFacets().test(f)
      return overlaps
    },
    featureTextX: function (f) {
      let s = Math.max(f.start, this.region.start + this.deltaB)
      return this.b2p(s)
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
      if (this.featureMouseover(f)) {
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
      let s = Math.max(t.exons[0].start, this.region.start + this.deltaB)
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
    codonGlyph (f, t, which) {
      const dir = f.strand === '+' ? 1 : -1
      let pos
      if ((f.strand === '+' && which === 'start')
      || (f.strand === '-' && which === 'stop')) {
        pos = t.cds.start
      } else {
        pos = t.cds.end
      }
      const x = this.b2p(pos + 0.5)
      const h = 8
      if (which === 'start') {
        // triangle pointing in transcription direction
        return `m${x},0 l0,${-h} l${dir * h},${h / 2} Z`
      } else {
        // triangle pointing down
        return `m${x},0 l${-h / 2},${-h} l${h},0 Z`
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
      const r = this.region
      //
      if (r.genome.name === '') return
      //
      let delta = Math.round((r.end - r.start + 1) / 2)
      this.seqStart = r.start
      this.busy = true
      this.$emit('busy-start')
      if (this.synGenome) {
        this.translator()
          .getBlocksInRange(
            r.genome,
            r.chr.name,
            r.start - delta,
            r.end + delta,
            this.synGenome)
          .then(bs => { this.blocks = bs })
      } else {
        this.blocks = []
      }
      this.dataManager().getGenes(r.genome, r.chr, r.start - delta, r.end + delta, this.showDetails).then(feats => {
        this.busy = false
        this.features = feats.filter(f => this.getFacets().test(f))
	this.dataManager().assignLanes(this.features, this.showDetails ? this.ppb : null, this.featureFontSize)
        this.nextTick(() => {
          this.$emit('busy-end')
          this.$emit('region-draw', this)
        })
        if (this.showSequence) {
          this.$emit('busy-start')
          this.dataManager().getSequence(r.genome, r.chr, r.start, r.end).then(data => {
            if (data) {
              this.seqStart = r.start - 1
              this.sequence = data
            } else {
              this.sequence = ''
            }
            this.$emit('busy-end')
          }).catch(err => {
            console.log('Error while fetching sequence: ', err)
            this.sequence = ''
            this.$emit('busy-end')
          })
        } else {
          this.sequence = ''
        }
      }).catch((e) => {
        this.$emit('busy-end')
      })
    },
    getEventObjects (e) {
      const f = e.target.closest('.feature')
      if (!f) return
      const fid = f.getAttribute('name')
      const feat = this.fIndex[fid]
      const t = e.target.closest('.transcript')
      const tid = t ? t.getAttribute('name') : null
      const transcr = tid ? feat.transcripts.filter(t => t.ID === tid)[0] : null
      return {
        feature: feat,
        transcript: transcr
      }
    },
    mousemove: function (e) {
      if (this.dragging) return
      let bb = this.$refs.underlay.getBoundingClientRect()
      let px = e.clientX - bb.x
      this.currRange = [px, px]
    },
    mouseenter: function (e) {
      document.body.focus()
      // this.$root.$emit('region-current', { region: this.region })
    },
    mouseleave: function (e) {
      // this.$root.$emit('region-current', null)
      if (this.dragging) return
      this.currRange = null
    },
    mouseover: function (e) {
      let f = this.getEventObjects(e)
      if (f) this.$root.$emit('feature-over', { region: this.region, feature: f.feature, transcript: f.transcript, event: e })
    },
    mouseout: function (e) {
      let f = this.getEventObjects(e)
      if (f) this.$root.$emit('feature-out', { region: this.region, feature: f.feature, transcript: f.transcript, event: e })
    },
    clicked: function (e) {
      this.$root.$emit('region-current', { region: this.region })
      if (e.altKey) {
        this.altClicked(e)
        return
      }
      let f = this.getEventObjects(e)
      if (f) {
        this.$root.$emit('feature-click', { region: this.region, feature: f.feature, transcript: f.transcript, event: e })
        e.stopPropagation()
      } else if (this.absorbNextClick) {
        e.stopPropagation()
      }
      this.absorbNextClick = false
    },
    altClicked: function (e) {
      let f = this.getEventObjects(e)
      if (f) {
        // alt clicked on a feature
        this.$root.$emit('feature-align', { region: this.region, feature: f.feature, transcript: f.transcript, event: e, basePos: this.clientXtoBase(e.clientX) })
        e.stopPropagation()
      } else {
        // alt clicked on region background
        // split region at that point
        const regionRect = this.$refs.underlay.getBoundingClientRect()
        const px = e.clientX - regionRect.left
        this.$root.$emit('region-change', { region: this.region, op: 'split', pos: px / regionRect.width })
      }
    },
    // Initialize all drag behaviors for this region
    initDrag () {
      this.initScrollDrag()
      this.initRegionDrag()
    },
    // Initializes handler for dragging a region L/R within its strip.
    initRegionDrag () {
      this.rDragging = false
      u.dragify(this.$refs.draghandle, {
        dragstart: function (e, d) {
          this.rDragging = true
          this.$emit('region-rdragstart', { region: this.region, vm: this })
        },
        drag: function (e, d) {
          this.regionDragDelta = d.deltaX
          this.$emit('region-rdrag', { region: this.region, vm: this, deltaX: d.deltaX })
        },
        dragend: function (e, d) {
          this.rDragging = false
          this.$emit('region-rdragend', { region: this.region, vm: this })
          this.regionDragDelta = 0
        }
      }, document.body, this)
    },
    // Initializes handler for dragging within a region (scroll, zoom, etc)
    initScrollDrag () {
      this.dragging = false
      u.dragify(this.$el, {
        dragstart: function (e, d) {
          this.dragging = true
          this.dragData = d
          d.dragged = false
          d.bb = this.$refs.underlay.getBoundingClientRect()
          d.shiftDrag = e.shiftKey
          d.altDrag = e.altKey
          d.metaDrag = e.metaKey
          this.currRange = [d.startX - d.bb.x, d.startX - d.bb.x]
        },
        drag: function (e, d) {
          d.dragged = true
          if (d.shiftDrag || d.altDrag || d.metaDrag) {
            let x1 = d.startX - d.bb.x
            let x2 = e.clientX - d.bb.x
            this.currRange = [Math.min(x1, x2), Math.max(x1, x2)]
            const crd = {
              start: this.currRange[0] / d.bb.width,
              length: (this.currRange[1] - this.currRange[0]) / d.bb.width,
              shiftDrag: d.shiftDrag,
              altDrag: d.altDrag
            }
            this.$root.$emit('region-drag-modified', crd)
          } else {
            this.$root.$emit('region-drag', d.deltaX)
          }
        },
        dragend: function (e, d) {
          if (!d.dragged || Math.abs(d.deltaX) < 3) {
            // this was actually just a click. If it was on the background, clear current selection
            if (!e.target.closest('.feature')) {
              this.$root.$emit('clear-selection')
            }
            this.dragData = null
            this.dragging = false
            this.regionScrollDelta = 0
            return
          }
          //
          const cr = this.currRange
          const crs = Math.min(cr[0], cr[1])
          const cre = Math.max(cr[0], cr[1])
          // Express the dragged region start and length as fractions relative to the whole region.
          // This allows easy conversion to the equiv part of other regions (for coordinated zooming).
          const pstart = crs / this.region.width
          const plength = (cre - crs + 1) / this.region.width
          //
          if (d.altDrag) {
            // selecting genomic sequence
            this.$root.$emit('region-selected', {
              region: this.region,
              pstart: pstart,
              plength: plength,
              reverseComplement: e.clientX < d.startX
            })
          } else if (d.shiftDrag || d.metaDrag) {
            // zoom in/out of dragged region === composition of centered zoom plus a scroll
            this.$root.$emit('region-change', {
              region: this.region,
              op: 'zoomscroll',
              pstart: pstart,
              plength: plength,
              out: d.metaDrag // whether this is a zoom out (true) or zoom in (false)
            })
          } else {
            // scroll
            const amt = this.deltaB / (this.region.end - this.region.start + 1)
            this.$root.$emit('region-change', { region: this.region, op: 'scroll', amt: amt })
          }
          
          //
          // A click event is fired (unavoidably) at mouseup. Here we set a flag for ourselves to ignore
          // the next click event (see method clicked() above).
          //
          this.absorbNextClick = true
          //
          this.regionScrollDelta = 0
          this.dragData = null
          this.dragging = false
          this.currRange = null
          this.$root.$emit('region-dragend')
        }
      }, this.$root.$el, this)
    }
  },
  created: function () {
    // create callbacks for the various events and save them so we can unregister them
    // in the destroyed hook
    this.cbRegionDrag = d => {
      if (this.context.scrollLock || this.dragging) this.regionScrollDelta = d
    }  
    this.cbRegionDragModified = crd => {
      if (!this.context.scrollLock || this.dragging) return
      const s = this.region.width * crd.start
      const e = s + this.region.width * crd.length
      this.currRange = [s, e]
    }
    this.cbRegionDragEnd = d => {
      this.regionScrollDelta = 0
      this.currRange = null
    }
    this.cbRegionSelected = d => {
      if (this.context.scrollLock || this.region === d.region) {
        const r = this.region
        const L = r.end - r.start + 1
        const start = Math.floor(r.start + d.pstart * L)
        const end = Math.floor(start + d.plength * L - 1)
	const gname = this.region.genome.name
	const cname = this.region.chr.name
	const rc = d.reverseComplement ? 'reverse complemented' : ''
        const seq = {
	  header: `>${gname}::${cname}:${start}..${end} ${rc} (dna)`,
          genome: this.region.genome.name,
          genomeUrl: this.region.genome.url,
          chromosome: this.region.chr.name,
          start: [start],
          length: [end - start + 1],
          type: 'dna',
          reverseComplement: d.reverseComplement,
          selected: true,
          totalLength: end - start + 1
        }
        this.$root.$emit('sequence-selected', [seq])
      }
    }
    this.cbFacetState = d => {
      this.getFeatures()
    }
    this.cbListSelection = d => {
      this.getFeatures()
    }
    //
    this.$root.$on('region-drag', this.cbRegionDrag)
    this.$root.$on('region-drag-modified', this.cbRegionDragModified)
    this.$root.$on('region-dragend', this.cbRegionDragEnd)
    this.$root.$on('region-selected', this.cbRegionSelected)
    this.$root.$on('facet-state', this.cbFacetState)
    this.$root.$on('list-selection', this.cbListSelection)
  },
  destroyed: function () {
    this.$root.$off('region-drag', this.cbRegionDrag)
    this.$root.$off('region-drag-modified', this.cbRegionDragModified)
    this.$root.$off('region-dragend', this.cbRegionDragEnd)
    this.$root.$off('region-selected', this.cbRegionSelected)
    this.$root.$off('facet-state', this.cbFacetState)
    this.$root.$off('list-selection', this.cbListSelection)
    this.$emit('region-delete')
    //console.log("Destroyed region ", this._uid)
  },
  mounted: function () {
    this.segLayout = new SegmentLayout()
    this.initDrag()
    this.getFeatures()
  }
})
</script>

<style>
.zoom-region {
  transition: transform 0s;
}
.zoom-region.dragging {
  transition: transform 0s;
}
.zoom-region .underlay {
  transition: height 0.5s;
}
.zoom-region > svg > text {
  transition: y 0.5s;
}
.zoom-region .zrBtn.delete {
  cursor: pointer;
}
.zoom-region .zrBtn.drag {
  cursor: grab;
}
.zoom-region.dragging .zrBtn.drag {
  cursor: grabbing;
}
.zoom-region .zrBtn:hover * {
  fill-opacity: 1;
}
.feature .transcript {
  transition: transform 0.5s;
}
.feature.pulse {
  outline-color: yellow;
  outline-width: 6px;
  animation: blinker 1s linear infinite;
}
@keyframes blinker {
  50% { outline-width: 0px; }
}
</style>
