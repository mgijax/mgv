<template>
  <g
    class="zoom-region"
    :class="{ current: isCurrent, dragging: dragging || rDragging, reversed: region.reversed }"
    :transform="`translate(${region.deltaX + regionDragDelta}, 0)`"
    >
  <svg
    @mouseover.stop="mouseover"
    @mouseout.stop="mouseout"
    @mousemove="mousemove"
    @mouseenter.stop="mouseenter"
    @mouseleave.stop="mouseleave"
    @click="clicked"
    @wheel="wheeled"
    :width="region.width"
    >
    <g
      :transform="`translate(${myDelta},${zeroOffset})`"
      >
      <!-- ======= synteny blocks =======
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
      -->
      <!-- ======= axis line ======= -->
      <line
        class="axis noevents"
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
        class="left-end-underlay"
        v-if="region.start - bpp * myDelta < 0"
        :x="region.reversed ? b2p(0) : -myDelta"
        :y="-zeroOffset"
        :width="Math.max(0, region.reversed ? (region.width - b2p(0) - myDelta) : (b2p(0) + myDelta))"
        :height="Math.max(height, 20)"
        fill="gray"
        />
      <!-- ======= right end underlay, shows when you scroll past the end of the chr  ======= -->
      <rect
        class="right-end-underlay"
        v-if="region.end - bpp * myDelta > region.chr.length"
        :x="region.reversed ? -myDelta : b2p(region.chr.length)"
        :y="-zeroOffset"
        :width="Math.max(0,ppb * (region.end - region.chr.length) - direction * myDelta)"
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
        :stroke="region.reversed ? 'red' : 'black'"
        :stroke-width="region.reversed ? 3 : 1"
        stroke-opacity="0.5"
        class="underlay"
        ref="underlay"
        :transform="`translate(${-myDelta},0)`"
        />
      <!-- ======= coordinates label ======= -->
      <text
        ref="coordinatesLabel"
        :x="coordinatesLabelX"
        :y="height - zeroOffset + 10"
        dominant-baseline="hanging"
        fill="black"
        font-size="10px"
        font-family="sans-serif"
        :font-weight="isCurrent ? 'bold' : 'normal'"
        :transform="`translate(${-myDelta},0)`"
        >{{coordinatesLabel}}<title>{{coordinatesLabel}}</title></text>
      <!-- Variants -->
      <g
        v-for="(v, vi) in variants"
        :key="'v'+vi"
        >
        <title>{{v.ID}}</title>
        <path
            :d="variantGlyph(v)"
            :fill="variantColor(v)"
            />
        <rect
            :x="b2p(v.start)"
            :y="-zeroOffset"
            :width="featureW(v)"
            :height="Math.max(height,10)"
            :stroke="variantColor(v)"
            stroke-width="0.5"
            stroke-opacity="0.5"
            fill-opacity="0.5"
            :fill="variantColor(v)"
            />
        </g> <!-- variants -->
      <!-- ======= sequence string ======= -->
      <text
        v-if="showSequence"
        :y="sequenceY"
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
          :y="sequenceY + sequenceFontSize"
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
	:strand="f.strand"
        class="feature"
        :class="{
          highlight: featureHighlighted(f),
          visible: featureVisible(f),
          selected: featureDirectlySelected(f)
        }"
        :transform="featureTransform(f)"
        :style="{ opacity: featureOpacity(f) }"
        v-show="featureVisible(f)"
        >
        <!-- ======= Underlay  ======= -->
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
          v-if="showDetails && featureVisible(f)"
          class="transcripts"
          >
        <g
          class="transcript"
          v-for="(t, ti) in spreadTranscripts ? f.transcripts : f.composite.exons ? [f.composite] : []"
          :key="t.ID"
          :name="t.ID"
          :transform="transcriptTransform(f, t, ti)"
          >
          <!-- ======= Transcript Underlay  ======= -->
          <rect
            class="underlay"
            :x="featureX(t)"
            :y="0"
            :width="featureW(t)"
            :height="featureH(t)"
            fill="white"
            :fill-opacity="spreadTranscripts ? (transcriptHighlighted(t) ? 0.6 : 0.2) : 0"
            />
          <!-- ======= Exons ======= -->
          <rect v-for="e in t.cds ? t.cds.pieces : t.exons"
            :key="e.ID"
            class="exon noevents"
            :x="featureX(e)"
            :y="isUTR(e) ? featureHeight / 4 : 0"
            :width="featureW(e)"
            :height="featureHeight * (isUTR(e) ? 0.5 : 1)"
            :fill="featureColor(f)"
            fill-opacity="0.5"
            stroke="none"
            />
          <!-- ======= Transcript axis line, arrow ======= -->
          <polyline
            class="noevents"
            :points="transcriptAxisPoints(f, t, ti)"
            :stroke="featureColor(f)"
            fill="none"
            />
          <!-- ======= Stop codon ======= -->
          <path v-if="t.cds && showStartStopCodons"
            class="noevents"
            :d="codonGlyph(f, t, 'stop')"
            fill="red"
            stroke="red"
            stroke-width="1"
            :transform="`translate(0,${4 + featureHeight/2})`"
            />
          <!-- ======= Start codon ======= -->
          <path v-if="t.cds && showStartStopCodons"
            class="noevents"
            :d="codonGlyph(f, t, 'start')"
            fill="cyan"
            stroke="cyan"
            stroke-width="1"
            :transform="`translate(0,${4 + featureHeight/2})`"
            />
        </g>
        <!-- Transcript labels -->
        <g
          class="transcript"
          v-for="(t, ti) in spreadTranscripts ? f.transcripts : f.composite.exons ? [f.composite] : []"
          :key="t.ID+'.lbl'"
          :transform="transcriptTransform(f, t, ti)"
          >
          <text
            v-if="spreadTranscripts && showDetails && (showFeatureLabels && showTranscriptLabels || transcriptHighlighted(t))"
            :x="transcriptTextX(t)"
            :y="featureHeight + 2"
            font-family="sans-serif"
            :font-size="transcriptFontSize"
            :font-weight="transcriptHighlighted(t) ? 'bold' : 'normal'"
            dominant-baseline="hanging"
            >{{t.cds && showProteinLabels ? t.cds.label : t.label}}</text>
        </g>
        </g> <!-- if showDetails -->
        <!-- Feature label -->
        <text
          class="symbol"
          v-if="featureShowLabel(f)"
          :x="featureTextX(f)"
          :x0="featureTextX(f)"
          :y="-3"
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
import { complement } from '@/lib/genetic_code'
//
export default MComponent({
  name: 'ZoomRegion',
  inject: [
    'dataManager',
    'featureColorMap',
    'getFacets'
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
    // maximum maxLaneP value for all regions in my strip
    allMaxLaneP: {
      type: Number,
      default: 0
    },
    // maximum maxLaneM value for all regions in my strip
    allMaxLaneM: {
      type: Number,
      default: 0
    },
    // amount by which to pad the rendered region
    pad: {
      type: Number,
      default: 0.5
    }
  },
  data: function () {
    return {
      features: [], // the features to draw
      blocks: [], // the synteny blocks to draw
      sequence: '', // the sequence to display
      seqStart: 0,
      variants: [],
      busy: false,
      currRange: null,
      dragging: false, // true while dragging within a region
      rDragging: false, // true while dragging region within its strip
      regionScrollDelta: 0, // while a region is being scrolled, the scroll amount (in px)
      regionDragDelta: 0 // while a region is being moved, the drag amount (in px)
    }
  },
  computed: {
    direction: function () {
      return this.region.reversed ? -1 : 1
    },
    coordinatesLabel: function () {
      const r = this.region
      const c = r.chr.name
      const s = u.prettyPrintBases(this.minBase, true)
      const e = u.prettyPrintBases(this.maxBase, true)
      const pp = u.prettyPrintBases(r.end - r.start + 1)
      return `${c}:${s}..${e} (${pp})`
    },
    coordinatesLabelX: function () {
      const e = this.$refs.coordinatesLabel
      const w = e ? e.textLength.baseVal.value : 0
      return Math.max(0, (this.region.width - w) / 2)
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
      return 1000000 * Math.min(this.cfg.detailThreshold, this.cfg.detailThresholdLimit)
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
    showProteinLabels: function () {
      return this.cfg.showProteinLabels
    },
    showDetails: function () {
      return (this.region.end - this.region.start + 1) < this.detailThreshold
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
    sequenceY: function () {
      if (this.showDetails && this.spreadTranscripts) {
        return -this.zeroOffset + this.sequenceFontSize
      } else {
        return -0.3 * this.sequenceFontSize
      }
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
      return this.app.currentSelectionSet
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
    minBase: function () {
      return this.region.start + this.direction * this.deltaB
    },
    //
    maxBase: function () {
      return this.region.end + this.direction * this.deltaB
    },
    // Max number of lanes above axis (plus strand)
    maxLaneP: function () {
      if (this.showDetails && this.spreadTranscripts) {
        return 1
      } else {
        let x = this.features.filter(f => (f.strand === null || f.strand === '+') && this.featureVisible(f)).reduce((v, f) => Math.max(v, this.lmap.get(f).l1), 0)
        return Math.max(x, 1)
      }
    },
    // Max number of lanes below axis (minus strand)
    maxLaneM: function () {
      let m
      if (this.showDetails && this.spreadTranscripts) {
        m = this.features.filter(f => this.featureVisible(f)).reduce((v, f) => Math.max(v, this.lmap.get(f).l2 + f.transcripts.length), 0)
      } else {
        m = this.features.filter(f => f.strand === '-' && this.featureVisible(f)).reduce((v, f) => Math.max(v, this.lmap.get(f).l1), 0)
      }
      return Math.max(m, 1)
    },
    // Total height
    height: function () {
      let h
      if (this.showDetails && this.spreadTranscripts) {
        h = (this.allMaxLaneP + this.allMaxLaneM) * (this.featureHeight + this.laneGap) + 2 * this.featureFontSize
      } else {
        h = (this.allMaxLaneP + this.allMaxLaneM) * (this.featureHeight + this.featureFontSize) + this.featureFontSize
      }
      return Math.max(h, this.cfg.minHeight)
    },
    // Y-distance from axis to top of box
    zeroOffset: function () {
      if (this.showDetails && this.spreadTranscripts) {
        return this.sequenceFontSize * 2 + 10
      } else {
        return this.allMaxLaneP * (this.featureHeight + this.featureFontSize) + this.featureFontSize
      }
    }
  },
  watch: {
    cxtString: function (newval, oldval) {
      if (newval !== oldval) this.getFeatures()
    },
    spreadTranscripts: function () {
      this.assignLanes()
      this.$nextTick(() => this.$emit('region-draw', this))
    },
    height: function () {
      this.$nextTick(() => this.$emit('region-draw', this))
    },
    showDetails: function(newval, oldval) {
      if (newval !== oldval) {
        this.$nextTick(() => this.$emit('region-draw', this))
      }
    },
    featureFontSize: function () {
      this.assignLanes()
    },
    showFeatureLabels: function () {
      this.assignLanes()
    }
  },
  methods: {
    assignLanes () {
      const ppb = this.ppb
      const fcn0 = () => true
      const fcn1 = (f) => this.featureHighlighted(f)
      const fcn = this.showDetails ? 
           (this.spreadTranscripts ? fcn0 : (this.showFeatureLabels ? fcn0 : fcn1))
           :
           (this.showFeatureLabels ? fcn0 : fcn1)
      this.lmap = this.dataManager().assignLanes(this.features, ppb, this.featureFontSize, fcn)
      this.$nextTick(() => this.$emit('region-draw', this))
    },
    clientXtoBase: function (x) {  
      const rx = this.$refs.underlay.getBoundingClientRect().left
      const baseOffset = (x - rx) * this.bpp
      const pos = Math.round(this.region.reversed ? this.region.end - baseOffset : this.region.start + baseOffset)
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
      return Math.floor(this.region.start + this.bpp * (this.region.reversed ? this.region.width - p : p))
    },
    // converts a base position to a pixel position
    b2p (b) {
      const p = this.ppb * (b - this.region.start)
      return this.region.reversed ? this.region.width - p : p
    },
    featureX (f) {
      return this.b2p(this.region.reversed ? f.end : f.start)
    },
    featureW (f) {
      return Math.max(1, (f.end - f.start + 1) * this.ppb)
    },
    featureY (f) {
      const lo = this.lmap.get(f)
      if (this.showDetails && this.spreadTranscripts) {
        return lo.l2 * (this.featureHeight + this.laneGap) + this.featureFontSize
      } else if (!f.strand || f.strand === '+') {
        return -lo.l1 * (this.featureHeight + this.featureFontSize)
      } else {
        return (lo.l1 - 1) * (this.featureHeight + this.featureFontSize) + this.featureFontSize
      }
    },
    featureH (f) {
      if (this.showDetails && this.spreadTranscripts && f.transcripts) {
        let tc = Math.max(f.transcripts.length, 1)
        return this.featureHeight * tc + this.laneGap * (tc - 1) + this.transcriptFontSize
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
    variantGlyph (v) {
      let x
      switch (v.so_term) {
        case 'point_mutation':
          // diamond
          x = this.b2p(v.start+0.5)   
          return `m${x},0 l-5,-5 l5,-5 l5,5 l-5,5`

        case 'delins':
        case 'MNV':
          // hourglass
          x = this.b2p(v.start)   
          return `m${x-5},0 l10,0 l-10,-10 l10,0 l-10,10`

        case 'insertion':
          // triangle down
          x = this.b2p(v.start)   
          return `m${x},0 l-5,-5 l10,0 l-5,5`

        case 'deletion':
          // box
          x = this.b2p(v.start)
          return `m${x},0 l0,-10 l5,0 l0,10 Z`

        default:
          throw "Don't know this type: " + v.soTerm
      }

    },
    variantColor (v) {
        const imp = v.glImpact
        if (!imp) {
            return 'gray'
        } else if (imp.includes('HIGH')) {
            return 'red'
        } else if (imp.includes('MODERATE')) {
            return 'orange'
        } else if (imp.includes('LOW')) {
            return 'cyan'
        } else {
            return 'gray'
        }
    },
    isUTR (e) {
      return e.type && e.type.endsWith('utr')
    },
    featureOpacity (f) {
      const nobodyHighlighted = !(this.context.currentMouseover || this.selectedSet.size || this.context.currentListSet)
      if (nobodyHighlighted) return 1
      return this.featureHighlighted(f) ? 1 : 1 - this.cfg.contrast
    },
    featureHighlighted: function (f) {
      // console.log('featureHighlighted', f.ID)
      return this.featureMouseover(f) || this.featureSelected(f) || this.featureInList(f)
    },
    featureMouseover: function (f) {
      return this.app.currentMouseover === f || this.app.currentMouseoverSet.has(f.cID)
    },
    transcriptHighlighted: function (t) {
      return t === this.context.currentMouseoverT
    },
    // Returns true iff feature f is in the current selection list (ie it was actually clicked on)
    featureDirectlySelected: function (f) {
      return this.context.currentSelection.indexOf(f) >= 0
    },
    // Returns true if feature is selected or is a homolog 
    featureSelected: function (f) {
      return this.selectedSet.has(f.cID ? f.cID : f.ID)
    },
    // Returns true if feature label should be shown
    featureShowLabel: function (f) {
      //return (this.showDetails && this.showFeatureLabels) || 
      return (this.showFeatureLabels) || 
        this.featureSelected(f) ||
        this.featureMouseover(f) ||
        this.featureInList(f)
    },
    // Returns true iff f's ID or cID is a member of the currently displayed list.
    featureInList: function (f) {
      if (!this.context.currentList) return false
      const s = this.context.currentListSet
      return s && (s.has(f.cID) || s.has(f.ID))
    },
    // Returns true iff the feature is currently visible, ie, it overlaps the coordinate range of this region
    // (takes scrolling into account)
    featureVisible: function (f) {
      let overlaps = f.start <= this.maxBase && f.end >= this.minBase
      return overlaps
    },
    featureTextX: function (f) {
      let s
      if (this.region.reversed) 
        s = Math.min(f.end, this.region.end - this.deltaB)
      else {
        s = Math.max(f.start, this.region.start + this.deltaB)
      }
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
      let s
      if (this.region.reversed) {
        s = Math.min(t.exons[t.exons.length-1].end, this.region.end - this.deltaB)
      } else {
        s = Math.max(t.exons[0].start, this.region.start + this.deltaB)
      }
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
      // this function's results are not defined if f.strand is null
      const dir = (f.strand === '+' ? 1 : -1) * (this.region.reversed ? -1 : 1)
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
        // start codon glyph
        return `m${x},${-h / 2} l${dir*h},0 l${-dir*h},${-h/2} l0,${h} l${dir*h},${-h/2}`
      } else {
        // stop codon glyph
        return `m${x},${-h / 2} l${dir*h},0 l${-dir*h},${-h/2} l0,${h} l${dir*h},${-h/2}`
        //return `m${x},${-h/2} l${-h/2},${-h} l${h},0 Z`
      }
    },
    transcriptAxisPoints (f, t, ti) {
      let y = this.transcriptY(f, t, ti) + this.featureHeight / 2
      y = this.featureHeight / 2
      let tx1 = this.transcriptX1(t)
      let tx2 = this.transcriptX2(t)
      let x1 = Math.min(tx1, tx2)
      let x2 = Math.max(tx1, tx2)
      let ext = 10
      let h = 5
      if (!this.spreadTranscripts || !f.strand) {
        return `${x1} ${y} ${x2} ${y}`
      }
      const rev = this.region.reversed
      const dir = f.strand === "+" ? (rev ? 'left' : 'right') : (rev ? 'right' : 'left')
      if (dir === 'right') {
        // arrow pointing right
        x2 += ext
        x2 = Math.min(x2, this.region.width + this.deltaB * this.ppb)
        return `${x1} ${y} ${x2} ${y} ${x2 - ext / 2} ${y - h} ${x2} ${y} ${x2 - ext / 2} ${y + h}`
      } else {
        // arrow pointing left
        x1 -= ext
        x1 = Math.max(x1, this.deltaB * this.ppb)
        return `${x2} ${y} ${x1} ${y} ${x1 + ext / 2} ${y - h} ${x1} ${y} ${x1 + ext / 2} ${y + h}`
      }
    },
    // Request features in my range, which will asynchromously cause a redraw.
    getFeatures () {
      //
      const r = this.region
      //
      if (r.genome.name === '') return
      //
      let delta = r.end - r.start + 1
      this.seqStart = r.start
      this.busy = true
      this.$emit('busy-start')
      this.blocks = []
      this.dataManager().getGenes(r.genome, r.chr, r.start - delta, r.end + delta, this.showDetails).then(feats => {
        this.busy = false
        this.features = feats.filter(f => this.getFacets().test(f))
        this.assignLanes()
        this.nextTick(() => {
          this.$emit('busy-end')
          this.$emit('region-draw', this)
        })
        if (this.showSequence) {
          this.$emit('busy-start')
          this.dataManager().getSequence(r.genome, r.chr, r.start - delta, r.end + delta).then(data => {
            if (data) {
              this.seqStart = r.start - delta - 1
              this.sequence = data
            } else {
              this.sequence = ''
            }
            this.$emit('busy-end')
          }).catch(() => {
            this.sequence = ''
            this.$emit('busy-end')
          })
        } else {
          this.sequence = ''
        }
        if (this.showDetails) {
            this.dataManager().getVariants(r.genome, r.chr, r.start - delta, r.end + delta).then(data => {
                this.variants = data
            })
        } else {
            this.variants = []
        }
      }).catch(() => {
        this.$emit('busy-end')
      })
    },
    getEventObjects (e) {
      const f = e.target.closest('.feature')
      if (!f) {
        return
      }
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
      // let bb = this.$refs.underlay.getBoundingClientRect()
      // let px = e.clientX - bb.x
      // this.currRange = [px, px]
      this.$root.$emit('region-mousemove', { region: this.region, vm: this, evt: e })
    },
    mouseenter: function (e) {
      document.body.focus()
      this.$root.$emit('region-mouseenter', { region: this.region, vm: this, evt: e })
    },
    mouseleave: function (e) {
      if (this.dragging) return
      //this.currRange = null
      this.$root.$emit('region-mouseleave', { region: this.region, vm: this, evt: e })
    },
    mouseover: function (e) {
      //console.log('over', e)
      let f = this.getEventObjects(e)
      if (f) this.$root.$emit('feature-over', { region: this.region, feature: f.feature, transcript: f.transcript, event: e })
    },
    mouseout: function (e) {
      //console.log('out', e)
      let f = this.getEventObjects(e)
      if (f) this.$root.$emit('feature-out', { region: this.region, feature: f.feature, transcript: f.transcript, event: e })
    },
    clicked: function (e) {
      this.$root.$emit('region-current', { region: this.region })
      if (this.absorbNextClick) {
        e.stopPropagation()
        this.absorbNextClick = false
        return
      }
      if (e.altKey) {
        this.altClicked(e)
        return
      }
      let f = this.getEventObjects(e)
      if (f) {
        this.$root.$emit('feature-click', { region: this.region, feature: f.feature, transcript: f.transcript, event: e })
        e.stopPropagation()
      }
    },
    altClicked: function (e) {
      let f = this.getEventObjects(e)
      if (f) {
        // alt clicked on a feature
        this.$root.$emit('region-change', {
          op : 'feature-align',
          region: this.region,
          feature: f.feature,
          transcript: f.transcript,
          event: e,
          basePos: this.clientXtoBase(e.clientX)
        })
        e.stopPropagation()
      } else {
        // alt clicked on region background
        // split region at that point
        const regionRect = this.$refs.underlay.getBoundingClientRect()
        const px = e.clientX - regionRect.left
        this.$root.$emit('region-change', { region: this.region, op: 'split', pos: px / regionRect.width })
      }
    },
    // Turns wheel (left/right) events into drags.
    // Initial wheel event:
    //    -> dragstart
    //    init timeout
    // Subsequent wheel events
    //    -> drag
    //    reset timeout
    // On timout:
    //    -> dragend
    wheeled: function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          return
      }
      e.stopPropagation()
      e.preventDefault()
      if (! this.wheelTimer) {
          // START
          this.wheelData = {
            startX: e.clientX,
            startY: e.clientY,
            deltaX: 0,
            deltaY: 0
          }
          this.$root.$emit("region-dragstart", { region: this.region, vm: this, evt: e, data: this.wheelData })
      } else {
        window.clearTimeout(this.wheelTimer)
      }
      // DRAG
      this.wheelData.deltaX -= e.deltaX
      this.$root.$emit("region-drag", { region: this.region, vm: this, evt: e, data: this.wheelData })
      // this.regionScrollDelta -= e.deltaX
      this.wheelTimer = window.setTimeout(() => {
        // END
        this.wheelTimer = null
        this.$root.$emit("region-dragend", { region: this.region, vm: this, evt: e, data: this.wheelData })
      }, this.cfg.wheelTimeout)
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
        dragstart: function () {
          this.rDragging = true
          this.$emit('region-rdragstart', { region: this.region, vm: this })
        },
        drag: function (e, d) {
          this.regionDragDelta = d.deltaX
          this.$emit('region-rdrag', { region: this.region, vm: this, deltaX: d.deltaX })
        },
        dragend: function () {
          this.rDragging = false
          this.$emit('region-rdragend', { region: this.region, vm: this })
          this.regionDragDelta = 0
        }
      }, document.body, this)
    },
    // Initializes handler for scrolling L/R by dragging.
    initScrollDrag () {
      this.dragging = false
      u.dragify(this.$el, {
        dragstart: function (e, d) {
          this.dragging = true
          this.dragData = d
          this.$root.$emit("region-dragstart", { region: this.region, vm: this, evt: e, data: d })
        },
        drag: function (e, d) {
          this.$root.$emit("region-drag", { region: this.region, vm: this, evt: e, data: d })
        },
        dragend: function (e, d) {
          this.$root.$emit("region-dragend", { region: this.region, vm: this, evt: e, data: d })
          this.dragData = null
          this.dragging = false
        }
      }, this.$root.$el, this)
    },
  },
  created: function () {
    this.cbFacetState = () => {
      this.getFeatures()
    }
    this.cbListSelection = () => {
      this.getFeatures()
    }
    this.cbSelectionState = () => {
      this.getFeatures()
    }
    //
    this.$root.$on('facet-state', this.cbFacetState)
    this.$root.$on('list-selection', this.cbListSelection)
    this.$root.$on('selection-state-changed', this.cbSelectionState)
  },
  updated: function () {
    this.$root.$emit('region-update', this)
  },
  destroyed: function () {
    this.$root.$off('facet-state', this.cbFacetState)
    this.$root.$off('list-selection', this.cbListSelection)
    this.$root.$off('selection-state-changed', this.cbSelectionState)
    this.$emit('region-delete')
  },
  mounted: function () {
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
.feature.pulse {
  outline-color: yellow;
  outline-width: 6px;
  animation: blinker 1s linear infinite;
}
@keyframes blinker {
  50% { outline-width: 0px; }
}
.zoom-region .noevents {
  pointer-events: none;
}
</style>
