<template>
  <g class="zoom-strip"
    :class="{ dragging: dragging, rGenome: genome === rGenome }"
    :transform="`translate(0,${zoomY + dragY + 14})`"
    :name="genome.name"
  >
    <!-- underlay -->
    <rect 
        class="underlay"
        x=0
        y=0
        :height="height"
        :width="width"
        stroke="none"
        fill="white"
        fill-opacity="0"
        />
    <!-- list of ZoomRegions -->
    <zoom-region
      v-for="zr in regions"
      :key="zr.id"
      :context="context"
      :region="zr"
      :allMinY="allMinY"
      :allMaxY="allMaxY"
      :allBelowThreshold="allBelowThreshold"
      :pad="cfg.pad"
      @region-draw="setHeight"
      @region-delete="setHeight"
      @busy-start="busyStart"
      @busy-end="busyEnd"
      @region-rdragstart="regionRdragstart"
      @region-rdrag="regionRdrag"
      @region-rdragend="regionRdragend"
      />
    <!-- region resize handles -->
    <rect
      v-for="(zr,zri) in regions"
      :key="zri+'-2'"
      class="border-handle"
      v-show="zri > 0 && !rDragging"
      :transform="`translate(${zr.deltaX - 5}, 0)`"
      :i="zri"
      x="0"
      y="0"
      width="5"
      :height="height"
      fill="gray"
      fill-opacity=1
      @mouseenter="activateHandle"
      />
    <!-- genome label -->
    <text
      name="label"
      :x="cfg.endCapWidth + 2"
      :y="-1"
      stroke="none"
      font-family= "sans-serif"
      fill="black">{{ genome.name }}</text>
    <!-- end cap -->
    <g>
      <rect name="endcap"
        x="0"
        y="0"
        :width="cfg.endCapWidth"
        :height="height + 1"
        :fill="endCapColor"
        />
      <!-- Reference genome button -->
      <text name="rGenomeBtn"
        ref="rGenomeBtn"
        dominant-baseline="hanging"
        :x="cfg.endCapWidth / 2"
        :y="2"
        text-anchor="middle"
        style="font-size: 12px; font-weight: bold; font-family: sans-serif;"
        :fill="endCapFontColor"
        @click="rGenomeClicked"
        >R<title>Make this the reference genome.</title></text>
      <!-- drag handle  -->
      <text name="draghandle"
        ref="draghandle"
        :x="cfg.endCapWidth / 2"
        :y="height / 2 + 10"
        text-anchor="middle"
        style="font-size: 20px; font-weight: bold;"
        :fill="endCapFontColor"
        >::<title>Drag up/down to reposition.</title></text>
      <!-- reverse button -->
      <text name="reverseBtn"
        ref="reverseBtn"
        dominant-baseline="hanging"
        :x="cfg.endCapWidth / 2"
        :y="height / 4"
        text-anchor="middle"
        style="font-size: 12px; font-weight: bold;"
        :fill="someoneIsReversed() ? 'red' : endCapFontColor"
        @click="reverseClicked"
        >{{someoneIsReversed() ? '&lt;' : '&gt;'}}<title>Click to reverse orientation of all regions in this strip. You can reverse an individual region from its control panel (right-click on the region background).</title></text>
      <!-- delete button  -->
      <text name="deleteBtn"
        :x="cfg.endCapWidth / 2"
        :y="height - 3"
        text-anchor="middle"
        style="font-size: 10px; font-weight: bold;"
        font-family="sans-serif"
        :fill="endCapFontColor"
        @click="deleteClicked"
        >X<title>Click to remove this strip.</title></text>
    </g>
    <!-- busy indicator -->
    <g
      v-show="busyCount > 0"
      @click="busyCount = 0"
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
//
export default MComponent({
  name: 'ZoomStrip',
  components: { ZoomRegion },
  props: [
    'context',
    'genome',
    'width',
    'strip',
    'regions',
    'rGenome',
  ],
  inject: ['regionManager'],
  data: function () {
    return {
      height: 60,
      dragY: 0,
      zoomY: -1, // causes new strips to add to the top of the view
      allMinY: 0,
      allMaxY: 0,
      allBelowThreshold: false,
      dragging: false,
      rDragging: false,
      featureHeight: 14,
      laneGap: 8,
      busyCount: 0,
      busyMessage: 'Loading...'
    }
  },
  computed: {
    isReference : function () {
      return this.genome === this.rGenome
    },
    endCapColor: function () {
      return this.isReference ? this.cfg.refEndCapColor : this.cfg.endCapColor
    },
    endCapFontColor: function () {
      return this.isReference ? this.cfg.refEndCapFontColor : this.cfg.endCapFontColor
    }
  },
  methods: {
    someoneIsReversed: function () {
      return this.regions.filter(r => r.reversed).length > 0
    },
    regionRdragstart: function () {
      this.rDragging = true
    },
    regionRdrag: function (d) {
      const drs = d.region.deltaX + d.deltaX
      let dir = 1
      this.$children.forEach(zr => {
        const r = zr.region
        dir = d.region.deltaX > zr.region.deltaX ? 1 : -1
        if (r === d.region) {
          dir = -1
        } else {
          let displace = (dir === 1 && drs < r.deltaX) || (dir === -1 && drs > r.deltaX)
          zr.regionDragDelta = displace ? dir * d.region.width : 0
        }
      })
    },
    regionRdragend: function () {
      this.rDragging = false
      this.$children.forEach(zr => {
        zr.regionDragDelta = 0
        zr.region.sortKey = zr.$refs.underlay.getBoundingClientRect().x
      })
      this.strip.regions.sort((a,b) => a.sortKey - b.sortKey)
      this.app.regionManager.layout()
      this.$root.$emit('context-changed')
    },
    activateHandle: function (e) {
      const handle = e.target
      if (handle.getAttribute('active')) return
      u.dragify(handle, {
        dragstart: function (e, d) {
          const i = parseInt(handle.getAttribute('i'))
          const r = this.regions[i-1]
          d.region = r
          d.prevX = d.startX
          d.dragged = false
        },
        drag: function (e, d) {
          this.regionManager().moveBorder(d.region, e.clientX - d.prevX, true)
          d.prevX = e.clientX
          d.dragged = true
        },
        dragend: function (e, d) {
          if (!d.dragged && e.altKey) {
            this.regionManager().joinRegion(d.region)
          }
          this.$root.$emit('context-changed')
        }
      }, this.$el, this)
      handle.setAttribute('active','true')
    },
    busyStart () {
      window.setTimeout(() => { this.busyCount += 1 }, 500)
    },
    busyEnd () {
      this.busyCount -= 1
    },
    setHeight () {
      if (this.$children.length === 0) {
          this.allMinY = 0
          this.allMaxY = 60
          this.height = 60
          this.allBelowThreshold = false
      } else {
          this.allMinY = Math.min(0, Math.min.apply(null, this.$children.map(r => r.minY))) - 10
          this.allMaxY = Math.max(0, Math.max.apply(null, this.$children.map(r => r.maxY))) + 10
          this.height = Math.max.apply(null, this.$children.map(r => r.height))
          this.allBelowThreshold = this.$children.map(r => r.belowThreshold).reduce((a,v) => a && v, true)
      }
      this.$emit('height-changed', this)
    },
    deleteClicked () {
      this.$root.$emit('region-change', { region: { genome: this.genome }, op: 'delete-strip' })
    },
    reverseClicked (e) {
      const sir = this.someoneIsReversed()
      this.regions.forEach(r => this.$root.$emit('region-change', {
        region: r,
        op: 'reverse',
        value: e.shiftKey ? undefined : !sir 
      }))
    },
    rGenomeClicked () {
      if (this.genome === this.app.rGenome) {
        this.$root.$emit('region-change', { op : 'clear-ref-genome' })
      } else {
        this.$root.$emit('region-change', { op : 'set-ref-genome', genome : this.genome })
      }
    }
  },
  mounted: function () {
    //
    let self = this
    u.dragify(this.$refs.draghandle, {
      // We dont actually do anything here except note that we are being dragged
      // and pass on the drag events. The parent container (ZoomMain) is where the
      // real action happens.
      dragstart: function (evt, data) {
        self.dragging = true
        data.vm = self
        data.genome = self.genome
        self.$emit('dragstart', { evt, data })
        self.$root.$emit('strip-dragstart', { evt, data })
      },
      drag: function (evt, data) {
        self.$emit('drag', { evt, data })
        self.$root.$emit('strip-drag', { evt, data })
      },
      dragend: function (evt, data) {
        self.dragging = false
        self.$emit('dragend', { evt, data })
        self.$root.$emit('strip-dragend', { evt, data })
      }
    }, this.$root.$el)
  }
})
</script>

<style>
.zoom-strip:not(.dragging) {
  transition: transform 0.3s;
}
.zoom-strip [name="endcap"] {
  transition: height 0.3s;
}
.zoom-strip text[name="label"] {
  transition: y 0.3s;
}
.zoom-strip [name="draghandle"] {
  cursor: grab;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
.zoom-strip.dragging [name="draghandle"] {
  cursor: grabbing;
}
[name="deleteBtn"] {
  cursor: pointer;
}
[name="reverseBtn"] {
  cursor: pointer;
}
[name="rGenomeBtn"] {
  cursor: pointer;
}
.border-handle {
  cursor: ew-resize;
}
</style>
