<template>
    <div
      class="zoom-region-controls flexrow"
      v-show="isOpen"
      :style="{ top: y + 'px', left: x + 'px' }"
      @click.stop=""
      >
      <!-- drag handle -->
      <i
        ref="dragHandle"
        class="material-icons"
        style="font-size: 14px; color: gray; cursor: grab;"
        >drag_indicator</i>
      <!-- coordinates box -->
      <input
        size="24"
        v-model="formattedCoords"
        title="Enter coordinates (chr:start..end) or landmark (symbol or ID). Coordinates are relative to the reference genome and are mapped to corresponding region(s) in each comparison genome. Enter a landmark to find that feature and line up the displays."
        @change="setCoords"
        />
      <!-- zoom in -->
      <m-button
        icon="zoom_in"
        title="Zoom in."
        @click="zoom(5)"
        />
      <!-- zoom out -->
      <m-button
        icon="zoom_out"
        title="Zoom out."
        @click="zoom(0.2)"
        />
      <!-- pan left -->
      <m-button
        icon="chevron_left"
        title="Pan left."
        @click="pan(-0.5)"
        />
      <!-- pan right -->
      <m-button
        icon="chevron_right"
        title="Pan right."
        @click="pan(0.5)"
        />
      <!-- split region -->
      <m-button
        icon="compare"
        title="Split this region."
        @click="split()"
        />
      <!-- make reference region -->
      <m-button
        icon="room"
        title="Make this the reference region."
        @click="makeRef()"
        />
      <!-- remove region -->
      <m-button
        icon="delete_forever"
        title="Remove this region."
        @click="remove()"
        />
      <!-- close -->
      <m-button
        icon="highlight_off"
        title="Close this contol."
        style="position: relative; top: -10px; left: 5px; font-size: 10px;"
        @click="close"
        />
    </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import gc from '@/lib/GenomeCoordinates'
import u from '@/lib/utils'
export default MComponent({
  name: 'ZoomRegionControls',
  components: { MButton },
  props: [
  ],
  data: function () {
    return {
      isOpen: false,
      x: 0,
      y: 0,
      formattedCoords: '',
      region: null
    }
  },
  methods: {
    open (region, y, x) {
      this.x = x
      this.y = y
      this.region = region
      this.isOpen = true
      this.reset()
    },
    close () {
      this.isOpen = false
    },
    zoom: function (amt) {
      this.$root.$emit('region-change', { vm: this, op: 'zoom', amt: amt })
    },
    pan: function (amt) {
      this.$root.$emit('region-change', { vm: this, op: 'scroll', amt: amt })
    },
    split: function () {
      this.$root.$emit('region-change', { vm: this, op: 'split', pos: 0.5 })
    },
    makeRef: function () {
      this.$root.$emit('region-change', { vm: this, op: 'make-reference' })
    },
    remove: function () {
      this.$root.$emit('region-change', { vm: this, op: 'remove' })
    },
    setCoords: function () {
      const r = gc.parse(this.formattedCoords)
      if (!r) {
        this.reset()
      } else {
        const rr = gc.validate(r, this.region.genome, true)
        this.$root.$emit('region-change', { vm: this, op: 'set', coords: rr })
      }
    },
    reset: function () {
      const r = this.region
      this.formattedCoords = `${r.chr.name}:${r.start}..${r.end}`
    }
  },
  mounted: function () {
    // close me if user clicks on background
    this.$root.$el.addEventListener('click', () => this.close())
    this.$watch('region', () => this.reset(), {'deep' : true})
    u.dragify(this.$refs.dragHandle, {
      dragstart: function (e, d) {
        d.prevX = e.clientX
        d.prevY = e.clientY
      },
      drag: function (e, d) {
        this.x += e.clientX - d.prevX
        this.y += e.clientY - d.prevY
        d.prevX = e.clientX
        d.prevY = e.clientY
      },
      dragend: function (e, d) {
      }
    }, this.$parent.$el, this)
  }
})
</script>

<style scoped>
.zoom-region-controls {
  justify-content: flex-start;
  position: absolute;
  background-color: rgba(255,255,255,0.7);
  padding: 6px;
  border-radius: 4px;
  border: thin solid gray;
}
</style>
