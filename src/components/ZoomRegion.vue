<template>
  <g
    transform="translate(0,0)"
    class="zoom-region"
    :class="{ current: isCurrent }"
    >
  <svg
    @mouseover.stop="mouseover"
    @mouseout.stop="mouseout"
    @mousemove="mousemove"
    @mouseenter.stop="mouseenter"
    @mouseleave.stop="mouseleave"
    @click="clicked"
    @dblclick="dblClicked"
    :width="region.width"
    >
    <g
      :transform="`translate(${myDelta},${zeroOffset})`"
      >
      <!-- ======= current range box ======= -->
      <g
        v-if="(dragging || trackMouse) && currRange"
        >
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
      <!-- ======= coordinates label ======= -->
      <text
        x="50%"
        :y="height - zeroOffset + 10"
        text-align="center"
        dominant-baseline="hanging"
        fill="black"
        font-size="10px"
        font-family="sans-serif"
        :transform="`translate(${-myDelta},0)`"
        >{{region.chr.name}}:{{region.start + deltaB}}..{{region.end + deltaB}}</text>
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
          v-for="(t, ti) in f.transcripts"
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
            :fill-opacity="transcriptHighlighted(t) ? 0.6 : 0.2"
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
            />
          <!-- ======= Stop codon ======= -->
          <path v-if="t.cds && showStartStopCodons"
            :d="codonGlyph(f, t, 'stop')"
            :fill="'red'"
            stroke="red"
            stroke-width="0.5"
            />
          <!-- transcript label -->
          <text
            v-if="spreadTranscripts && showDetails && (showTranscriptLabels || transcriptHighlighted(t))"
            :x="transcriptTextX(t)"
            :y="featureHeight"
            :font-weight="t.cds ? 'bold' : 'normal'"
            font-family="sans-serif"
            :font-size="transcriptFontSize"
            dominant-baseline="hanging"
            >{{t.cds ? t.cds.ID : t.ID}}</text>
        </g>
        </g>
        <!-- feature label -->
        <text
          class="symbol"
          v-if="(showDetails && showFeatureLabels) || featureSelected(f) || featureMouseover(f) || featureInList(f)"
          :x="featureTextX(f)"
          :x0="featureTextX(f)"
          :y="0"
          :font-size="featureFontSize"
          :style="{
            textAnchor: 'middle',
            fontFamily: 'sans-serif',
            fontWeight: featureMouseover(f) ? 'bold' : 'normal'
          }"
          >
          {{f.symbol || f.ID}}
          </text>
      </g> <!-- features -->
    <!--
    -->
    <g
      class="deleteBtn"
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
  inject: ['featureColorMap', 'getFacets', 'translator'],
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
      dragging: false,
      currRange: null,
      busy: false,
      regionScrollDelta: 0
    }
  },
  computed: {
    isCurrent: function () {
      return this.region === this.context.currRegion
    },
    scomplement: function () {
      return complement(this.sequence)
    },
    myDelta: function () {
      return this.dragging ? this.regionScrollDelta : this.globalScrollDelta
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
      return (this.region.end - this.region.start + 1) < this.sequenceThreshold
      // return (this.context.coords.end - this.context.coords.start + 1) < this.sequenceThreshold
    },
    showStartStopCodons: function () {
      return this.cfg.showStartStopCodons
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
      let h = (this.allMaxLaneP + this.allMaxLaneM) * (this.featureHeight + this.laneGap) + this.laneGap + 4
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
    }
  },
  mounted: function () {
    this.segLayout = new SegmentLayout()
    this.initDrag()
    this.getFeatures()
  },
  updated: function () {
    this.spreadText()
  },
  destroyed: function () {
    this.$emit('region-delete')
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
    spreadText: function () {
      // get all the symbols (text nodes) in my region
      let symbols = this.$el.querySelectorAll('.feature .symbol')
      // get each symbol's bounding rect. Partition into lists at the same y-coordinate
      let y2rects = {}
      symbols.forEach(t => {
        const x = parseFloat(t.getAttribute('x0')) // midpoint of text
        const r = t.getBoundingClientRect()
        const start = x - r.width / 2
        if (!(r.y in y2rects)) y2rects[r.y] = []
        y2rects[r.y].push({text: t, rect: { width: r.width, start: start, end: start + r.width - 1 }})
      })
      // spread text within each tier
      for (let y in y2rects) {
        let rects = y2rects[y]
        let rs = rects.map(r => r.rect)
        this.segLayout.layout(rs)
        rs.forEach((r, i) => {
          let t = rects[i].text
          t.setAttribute('x', r.start + r.width / 2)
        })
      }
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
      let s = this.context.currentListSet
      return s && (s.has(f.cID) || s.has(f.ID))
    },
    featureVisible: function (f) {
      let overlaps = f.start <= (this.region.end + this.deltaB) && f.end >= (this.region.start + this.deltaB)
      return overlaps && this.getFacets().test(f)
    },
    featureTextX: function (f) {
      let s = Math.max(f.start, this.region.start + this.deltaB)
      let e = Math.min(f.end, this.region.end + this.deltaB)
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
      if (this.region.genome.name === '') return
      //
      let delta = Math.round((this.region.end - this.region.start + 1) / 2)
      this.seqStart = this.region.start
      this.busy = true
      this.$emit('busy-start')
      if (this.synGenome) {
        this.translator()
          .getBlocksInRange(
            this.region.genome,
            this.region.chr.name,
            this.region.start - delta,
            this.region.end + delta,
            this.synGenome)
          .then(bs => { this.blocks = bs })
      } else {
        this.blocks = []
      }
      this.dataManager.getGenes(this.region.genome, this.region.chr, this.region.start - delta, this.region.end + delta, this.showDetails).then(feats => {
        this.busy = false
        this.features = feats
        this.nextTick(() => {
          this.$emit('busy-end')
          this.$emit('region-draw', this)
        })
        if (this.showSequence) {
          this.$emit('busy-start')
          this.dataManager.getSequence(this.region.genome, this.region.chr, this.region.start, this.region.end).then(data => {
            if (data) {
              this.seqStart = data.start
              this.sequence = data.seq
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
      }).catch(() => this.$emit('busy-end'))
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
      this.$root.$emit('region-current', this.region)
    },
    mouseleave: function (e) {
      this.$root.$emit('region-current', null)
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
      this.$root.$emit('region-click', { region: this.region, event: e })
      let f = this.getEventObjects(e)
      if (f) {
        this.$root.$emit('feature-click', { region: this.region, feature: f.feature, transcript: f.transcript, event: e })
        e.stopPropagation()
      } else if (this.absorbNextClick) {
        e.stopPropagation()
      }
      this.absorbNextClick = false
    },
    dblClicked: function (e) {
      let f = this.getEventObjects(e)
      if (f) {
        // double clicked on a feature
        this.$root.$emit('feature-align', { region: this.region, feature: f.feature, transcript: f.transcript, event: e, basePos: this.clientXtoBase(e.clientX) })
        e.stopPropagation()
      } else {
        // double clicked on region background
        // split region at that point
        const regionRect = this.$refs.underlay.getBoundingClientRect()
        const px = e.clientX - regionRect.left
        this.$root.$emit('region-change', { region: this.region, op: 'split', pos: px / regionRect.width })
      }
    },
    initDrag () {
      this.dragging = false
      // For lockstep dragging across regions, broadcast the drag deltas
      u.dragify(this.$el, {
        dragstart: function (e, d) {
          this.dragging = true
          this.dragData = d
          d.dragged = false
          d.bb = this.$refs.underlay.getBoundingClientRect()
          d.shiftDrag = e.shiftKey
          d.altDrag = e.altKey
          this.currRange = [d.startX - d.bb.x, d.startX - d.bb.x]
        },
        drag: function (e, d) {
          d.dragged = true
          if (d.shiftDrag || d.altDrag) {
            let x1 = d.startX - d.bb.x
            let x2 = e.clientX - d.bb.x
            this.currRange = [Math.min(x1, x2), Math.max(x1, x2)]
          } else {
            this.regionScrollDelta = d.deltaX
            this.$root.$emit('region-drag', d.deltaX)
          }
        },
        dragend: function (e, d) {
          this.$root.$emit('region-dragend')
          if (!d.dragged) {
            // this was actually just a click. If it was on the background, clear current selection
            if (!e.target.closest('.feature')) {
              this.$root.$emit('context', { currentSelection: [] })
            }
            this.dragData = null
            this.dragging = false
            this.regionScrollDelta = 0
            return
          }
          const b1 = Math.floor(this.region.start + this.currRange[0] / this.ppb)
          const b2 = Math.floor(this.region.start + this.currRange[1] / this.ppb)
          const start = Math.min(b1, b2)
          const end = Math.max(b1, b2)
          //
          if (d.altDrag) {
            // select genomic sequence
            const region = {
              genome: this.region.genome,
              chr: this.region.chr,
              start: start,
              end: end,
              type: 'dna',
              reverseComplement: e.clientX < d.startX,
              selected: true,
              length: end - start + 1
            }
            this.$root.$emit('region-selected', region)
            this.regionScrollDelta = 0
          } else if (d.shiftDrag) {
            if (e.metaKey) {
              // zoom out
              const r = this.region
              const f = (r.end - r.start + 1) / (end - start + 1)
              const A = f * (start - r.start + 1)
              const B = f * (r.end - end + 1)
              this.$root.$emit('region-change', {
                region: this.region,
                op: 'set',
                coords: {
                  chr: this.region.chr,
                  start: Math.floor(r.start - A),
                  end: Math.floor(r.end + B)
                }})
            } else {
              // zoom in
              this.$root.$emit('region-change', {
                region: this.region,
                op: 'set',
                coords: {
                  chr: this.region.chr,
                  start: Math.floor(start),
                  end: Math.floor(end)
                }})
            }
            this.regionScrollDelta = 0
          } else {
            // const db = this.deltaB;
            // this.region.start += db
            // this.region.end += db
            const amt = this.deltaB / (this.region.end - this.region.start + 1)
            this.$root.$emit('region-change', { region: this.region, op: 'scroll', amt: amt })
            this.regionScrollDelta = 0
          }
          
          //
          // for some reason, a click event is fired at mouseup, even though dragify handlers call
          // stopPropagation and preventDefault. So here we just set a little flag for ourselves to ignore
          // the next click event (see method clicked() above).
          //
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
.zoom-region .deleteBtn {
  cursor: pointer;
}
.zoom-region .deleteBtn:hover * {
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
