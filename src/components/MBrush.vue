<template>
  <g
    class="m-brush"
    :class="{ brushing: brushing }"
    :orientation="orientation"
    @mouseenter="$emit('mouseenter', $event)"
    @mouseleave="$emit('mouseleave', $event)"
    >
    <g name="tabgroup"
      >
      <rect
        name="tabhandleup"
        ref="tabhandleup"
        class="tabhandle"
        :x="tabX"
        :y="tabY-9"
        :width="tabW"
        :height="10"
        :fill="fill"
        fill-opacity="0"
        stroke="none"
        />
      <rect
        name="tabhandledn"
        ref="tabhandledn"
        class="tabhandle"
        :x="tabX"
        :y="tabY + tabH - 1"
        :width="tabW"
        :height="10"
        :fill="fill"
        fill-opacity="0"
        stroke="none"
        />
      <rect
        name="tab"
        ref="tab"
        :x="tabX"
        :y="tabY"
        :width="tabW"
        :height="tabH > 1 ? tabH : 1"
        :fill="fill"
        fill-opacity="0.3"
        :stroke="fill"
        />
    </g>
  </g>
</template>

<script>
import MComponent from '@/components/MComponent'
import Vue from 'vue'
import u from '@/lib/utils'
export default MComponent({
  name: 'MBrush',
  props: [
    'x',
    'y',
    'width',
    'height',
    'fill',
    'orientation',
    'range',
    'tabRange',
  ],
  data: function () {
    return {
      currentRange: this.tabRange.slice(),
      maxLength: this.range[1] - this.range[0] + 1,
      brushing: false,
      dragX: 0
    }
  },
  computed: {
    trigger: function () {
      return JSON.stringify(this.tabRange)
    },
    ppb: function () {
      return this.height / (this.range[1] - this.range[0] + 1)
    },
    tabX: function () {
      return this.x + this.dragX
    },
    tabY: function () {
      return this.ppb * (this.currentRange[0] - this.range[0])
    },
    tabW: function () {
      return this.width
    },
    tabH: function () {
      return this.ppb * (this.currentRange[1] - this.currentRange[0] + 1)
    }
  },
  mounted: function () {
    Vue.nextTick(() => this.initDrag())
  },
  watch: {
    trigger: function () { this.reset() }
  },
  methods: {
    reset () {
      this.currentRange = this.tabRange.slice()
    },
    // Returns the range coordinate og the specified pixel position
    p2b: function (p) {
      return p / this.ppb
    },
    // Returns the pixel position of the specified range coordinate
    b2p: function (r) {
      return r * this.ppb
    },
    clamp: function (r) {
      let s = Math.round(Math.min(r[0], r[1]))
      let e = Math.round(Math.max(r[0], r[1]))
      if (s < 1) {
        e = Math.min(e - s + 1, this.maxLength)
        s = 1
      } else if (e > this.maxLength) {
        s = this.maxLength - e + s
        e = this.maxLength
      }
      return [s, e]
    },
    chop: function (r) {
      let s = Math.round(Math.min(r[0], r[1]))
      let e = Math.round(Math.max(r[0], r[1]))
      s = Math.max(1, s)
      e = Math.min(this.maxLength, e)
      return [s, e]
    },
    initDrag () {
      //
      if (!this.$refs.tab) return
      // Drag handlers for the tab
      u.dragify(this.$refs.tab, {
        dragstart: function () {
          this.$emit('dragstart', { vm: this })
        },
        drag: function (evt, data) {
          let b = this.p2b(this.orientation === 'h' ? data.deltaX : data.deltaY)
          let nc = [this.tabRange[0] + b, this.tabRange[1] + b]
          this.currentRange = this.clamp(nc)
          this.brushing = true
          // this.dragX = data.deltaX
        },
        dragend: function () {
          this.notify()
          this.brushing = false
          this.dragX = 0
        }
      }, this.app.$el, this)
      // Drag handlers for the up tabhandle
      u.dragify(this.$refs.tabhandleup, {
        dragstart: function () {
          this.$emit('dragstart', { vm: this })
        },
        drag: function (evt, data) {
          let b = this.p2b(this.orientation === 'h' ? data.deltaX : data.deltaY)
          let nc = [this.tabRange[0] + b, this.tabRange[1]]
          this.currentRange = this.chop(nc)
          this.brushing = true
        },
        dragend: function () {
          this.notify()
          this.brushing = false
        }
      }, this.app.$el, this)
      // Drag handlers for the down tabhandle
      u.dragify(this.$refs.tabhandledn, {
        dragstart: function () {
          this.$emit('dragstart', { vm: this })
        },
        drag: function (evt, data) {
          let b = this.p2b(this.orientation === 'h' ? data.deltaX : data.deltaY)
          let nc = [this.tabRange[0], this.tabRange[1] + b]
          this.currentRange = this.chop(nc)
          this.brushing = true
        },
        dragend: function () {
          this.notify()
          this.brushing = false
        }
      }, this.app.$el, this)
    },
    notify: function () {
      this.$emit('dragend', { vm: this })
      this.$emit('brush', { vm: this, range: this.currentRange.slice() })
    }
  }
})
</script>

<style scoped>
.m-brush rect[name="tab"] {
  cursor: move;
}
.m-brush .tabhandle {
  cursor: ns-resize;
}
.m-brush[orientation="h"] .tabhandle {
  cursor: ew-resize;
}
</style>
