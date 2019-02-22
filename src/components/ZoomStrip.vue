<template>
  <g class="zoom-strip" :class="{ dragging: dragging }">
    <!-- genome label -->
    <text
      name="label"
      :x="cfg.endCapWidth"
      :y="height + 10"
      alignment-baseline="hanging"
      stroke="none"
      fill="black">{{ genome.name }}</text>
    <!-- list of ZoomRegions -->
    <zoom-region
      v-for="(zr,zri) in regions"
      :key="zri"
      :genome="genome"
      :context="context"
      :chr="zr.chr"
      :start="zr.start"
      :end="zr.end"
      :ori="zr.ori"
      :pad="cfg.pad"
      :width="zr.width"
      :allMaxLaneP="allMaxLaneP"
      :allMaxLaneM="allMaxLaneM"
      :transform="`translate(${zr.deltaX}, 0)`"
      :regionScrollDelta="regionScrollDelta"
      @region-draw="setHeight"
      @busy-start="busyStart"
      @busy-end="busyEnd"
      />
    <!-- end cap -->
    <rect name="endcap"
      x="0"
      y="0"
      :width="cfg.endCapWidth"
      :height="height"
      :fill="endCapColor"
      />
    <!-- drag handle  -->
    <text name="draghandle"
      ref="draghandle"
      :x="cfg.endCapWidth / 2"
      :y="height / 2 + 10"
      text-anchor="middle"
      style="font-size: 20px; font-weight: bold;"
      fill="gray"
      >::<title>Drag up/down to reposition.</title></text>
    <!-- busy indicator -->
    <g
      v-show="busyCount > 0"
      >
      <rect 
        x=0
        y=0
        :height="height"
        :width="width"
        :style="{ fillOpacity: 0.3 }"
        />
      <text
        :x="width / 2"
        :y="height / 2"
        fill="white"
        >{{busyMessage}}</text>
    </g>
  </g>
</template>

<script>
import MComponent from '@/components/MComponent'
import ZoomRegion from '@/components/ZoomRegion'
import u from '@/lib/utils'
import config from '@/config'
//
export default MComponent({
  name: 'ZoomStrip',
  components: { ZoomRegion },
  props: [
    'context',
    'genome',
    'width',
    'regionScrollDelta'
  ],
  inject: ['translator'],
  data: function () {
    return {
      height: 60,
      allMaxLaneP: 0,
      allMaxLaneM: 0,
      dragging: false,
      featureHeight: 14,
      laneGap: 8,
      regions: [],
      busyCount: 0,
      busyMessage: 'Busy...'
    }
  },
  computed: {
    endCapColor: function () {
      return this.context.rGenome === this.genome ? this.cfg.refEndCapColor : this.cfg.endCapColor
    },
    cxtString: function () {
      return [
        this.context.rGenome.name,
        this.genome.name,
        this.context.coords.chr.name,
        this.context.coords.start,
        this.context.coords.end,
        this.context.lcoords.landmark,
        this.context.lcoords.delta,
        this.context.lcoords.length
      ].join(':')
    }
  },
  methods: {
    busyStart () {
      window.setTimeout(() => { this.busyCount += 1 }, 1000)
    },
    busyEnd () {
      this.busyCount -= 1
    },
    setHeight () {
      this.height = Math.max.apply(null, this.$children.map(r => r.height))
      this.allMaxLaneP = Math.max.apply(null, this.$children.map(r => r.maxLaneP))
      this.allMaxLaneM = Math.max.apply(null, this.$children.map(r => r.maxLaneM))
      this.genome.height = this.height
      this.$emit('height-changed', this)
    },
    // lay out the regions horizontally
    layoutRegions (regions) {
      regions.sort((a, b) => a.index - b.index)
      let totalLength = 0
      regions = regions.reduce((nrs, r) => {
        let prev = nrs[nrs.length - 1]
        if (prev && prev.index === r.index) return nrs
        totalLength += (r.end - r.start + 1)
        if (!prev || prev.index + 1 !== r.index || prev.ori !== r.ori) {
          nrs.push(r)
        } else {
          prev.end = r.end
          prev.index = r.index
        }
        return nrs
      }, [])
      let dx = 12
      let gap = 2
      let totalGap = dx + gap * (regions.length - 1)
      regions.forEach(r => {
        let w = (this.width - totalGap) * (r.end - r.start + 1) / totalLength
        r.width = w
        r.deltaX = dx
        dx += r.width + gap
      })
      return regions
    },
    computeRegions () {
      let cc = this.context.coords
      let lcc = this.context.lcoords
      let lm = lcc.landmark ? this.dataManager.getGenolog(lcc.landmark, this.genome) : null
      if (!this.genome.chromosomes) {
        // if here, this is a very early call before everybody is initialized.
        // IMPORANT: need to touch start/end here so that they register with reactivity system
        // (Is there a better way??)
        this.regions = this.layoutRegions([{
          chr: { name: '?' },
          start: cc.start,
          end: cc.end,
          landmark: lcc.landmark,
          alignOn: config.ZoomRegion.featureAlignment
        }])
      } else if (lm) {
        // landmark mode
        let delta = lcc.delta
        let w = cc.end - cc.start + 1
        const alignOn = config.ZoomRegion.featureAlignment
        let lmp
        switch (alignOn) {
        case '5-prime':
          lmp = lm.strand === '+' ? lm.start : lm.end
          break
        case '3-prime':
          lmp = lm.strand === '+' ? lm.end : lm.start
          break
        case 'proximal':
          lmp = lm.start
          break
        case 'distal':
          lmp = lm.end
          break
        case 'midpoint':
          lmp = Math.floor((lm.start + lm.end) / 2)
          break
        default:
        }
        let s = Math.round(lmp - w / 2) + delta
        if (this.genome === this.context.rGenome) {
          // if here, I am the ZoomStrip for the reference genome and we have just computed the actual
          // coordinates from the landmark feature. Need to inform the app what those coordinates are.
          let c = this.app.coords
          c.chr = lm.chr
          c.start = s
          c.end = s + w - 1
        }
        this.regions = this.layoutRegions([{
          chr: lm.chr,
          start: s,
          end: s + w - 1
        }])
      } else if (this.genome === this.context.rGenome) {
        // this is the ref genome. Use the context coordinates
        this.regions = this.layoutRegions([{
          chr: cc.chr,
          start: cc.start,
          end: cc.end
        }])
      } else {
        // Map the reference genome coordinates to region(s) in this genome
        this.translator().translate(this.context.rGenome, cc.chr.name, cc.start, cc.end, this.genome).then(rs => {
          this.regions = this.layoutRegions(rs)
        })
      }
    }
  },
  watch: {
    width: function () {
      this.regions = this.layoutRegions(this.regions)
    }
  },
  mounted: function () {
    //
    this.$watch('cxtString', s => {
      this.computeRegions()
    }, { deep: true, immediate: true })
    //
    let self = this
    u.dragify(this.$refs.draghandle, {
      // We dont actually do anything here except note that we are being dragged
      // and pass on the drag events. The parent container (ZoomMain) is where the
      // real action happens.
      dragstart: function (evt, data) {
        self.dragging = true
        data.strip = self
        data.genome = self.genome
        self.$emit('dragstart', { evt, data })
      },
      drag: function (evt, data) {
        self.$emit('drag', { evt, data })
      },
      dragend: function (evt, data) {
        self.dragging = false
        self.$emit('dragend', { evt, data })
      }
    }, this.$root.$el)
  },
  beforeDestroy: function () {
    console.log('Destroying', this.genome.name, this._uid)
  }
})
</script>

<style>
.zoom-strip [name="endcap"] {
  transition: height 0.5s;
}
.zoom-strip text[name="label"] {
  transition: y 0.5s;
}
.zoom-strip > [name="draghandle"] {
  cursor: grab;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
.zoom-strip.dragging > [name="draghandle"] {
  cursor: grabbing;
}
</style>
