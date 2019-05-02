<template>
  <g class="zoom-strip"
    :class="{ dragging: dragging }"
    :transform="`translate(0,${zoomY + dragY})`"
  >
    <!-- genome label -->
    <text
      name="label"
      :x="cfg.endCapWidth"
      :y="height + 10"
      dominant-baseline="hanging"
      stroke="none"
      font-family= "sans-serif"
      fill="black">{{ genome.name }}</text>
    <!-- list of ZoomRegions -->
    <zoom-region
      v-for="(zr,zri) in regions"
      :key="zr.id"
      :context="context"
      :region="zr"
      :allMaxLaneP="allMaxLaneP"
      :allMaxLaneM="allMaxLaneM"
      :pad="cfg.pad"
      :synGenome="synGenome"
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
      :transform="`translate(${zr.deltaX - 2.5}, 0)`"
      :i="zri"
      x="0"
      y="0"
      width="5"
      :height="height"
      fill="gray"
      fill-opacity=1
      @mouseenter="activateHandle"
      />
    <!-- end cap -->
    <rect name="endcap"
      x="0"
      y="0"
      :width="cfg.endCapWidth"
      :height="height + 1"
      :fill="endCapColor"
      />
    <!-- delete button  -->
    <text name="deleteBtn"
      :x="cfg.endCapWidth / 2"
      :y="2"
      dominant-baseline="hanging"
      text-anchor="middle"
      style="font-size: 10px; font-weight: bold;"
      font-family="sans-serif"
      fill="gray"
      @click="deleteClicked"
      >X<title>Click to remove this strip.</title></text>
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
    'strip',
    'regions',
    'synGenome'
  ],
  inject: ['translator', 'regionManager'],
  data: function () {
    return {
      height: 60,
      dragY: 0,
      zoomY: -1, // causes new strips to add to the top of the view
      allMaxLaneP: 0,
      allMaxLaneM: 0,
      dragging: false,
      rDragging: false,
      featureHeight: 14,
      laneGap: 8,
      busyCount: 0,
      busyMessage: 'Busy...'
    }
  },
  computed: {
    endCapColor: function () {
      const isref = this.context.rRegion && this.context.rRegion.genome === this.genome
      return isref ? this.cfg.refEndCapColor : this.cfg.endCapColor
    },
  },
  methods: {
    regionRdragstart: function (d) {
      this.rDragging = true
    },
    regionRdrag: function (d) {
      const drs = d.region.deltaX + d.deltaX
      const dre = drs + d.region.width - 1
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
    regionRdragend: function (d) {
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
        },
        drag: function (e, d) {
          this.regionManager().moveBorder(d.region, e.clientX - d.prevX, true)
          d.prevX = e.clientX
        },
        dragend: function (e, d) {
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
      this.height = Math.max.apply(null, this.$children.map(r => r.height))
      this.allMaxLaneP = Math.max.apply(null, this.$children.map(r => r.maxLaneP))
      this.allMaxLaneM = Math.max.apply(null, this.$children.map(r => r.maxLaneM))
      this.$emit('height-changed', this)
    },
    deleteClicked () {
      this.$root.$emit('region-change', { region: { genome: this.genome }, op: 'delete-strip' })
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
.zoom-strip:not(.dragging) {
  transition: transform 0.3s;
}
.zoom-strip [name="endcap"] {
  transition: height 0.3s;
}
.zoom-strip text[name="label"] {
  transition: y 0.3s;
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
[name="deleteBtn"] {
  cursor: pointer;
}
.border-handle {
  cursor: ew-resize;
}
</style>
