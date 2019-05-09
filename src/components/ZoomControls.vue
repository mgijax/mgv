<template>
    <div
      class="zoom-controls flexrow"
      :class="{ fixed: fixed }"
      :style="{ top: offset + 'px' }"
      >
      <genome-selector
        :allGenomes="context.allGenomes"
        :strips="context.strips"
        :genomeSets="context.genomeSets"
        />
      <!-- Search box -->
      <div class="flexrow">
        <label>Find</label>
        <input
          ref="searchBox"
          size="24"
          @keypress="blurOnEnter"
          @blur="findLandmark($event.target.value)"
          />
      </div>
      <!-- aligned-on text -->
      <div
        class="flexcolumn"
        v-if="context.lcoords && context.lcoords.landmark"
        >
        <span>Aligned on {{ context.lcoords.landmark }}</span>
        </div>
      <!-- zoom/scroll controls -->
      <div class="flexrow">
        <m-button
          icon="zoom_in"
          @click="$root.$emit('region-change', { op: 'zoom', amt: $event.shiftKey ? 0.1 : 0.5 })"
          title="Click to zoom in. Shift-click to zoom in more"
          />
        <m-button
          icon="zoom_out"
          @click="$root.$emit('region-change', { op: 'zoom', amt: $event.shiftKey ? 10 : 2 })"
          title="Click to zoom out. Shift-click to zoom out more"
          />
        <m-button
          icon="chevron_left"
          @click="$root.$emit('region-change', { op: 'scroll', amt: $event.shiftKey ? 0.8 : 0.2 })"
          title="Click to pan left. Shift-click to scroll left more."
          />
        <m-button
          icon="chevron_right"
          @click="$root.$emit('region-change', { op: 'scroll', amt: $event.shiftKey ? -0.8 : -0.2 })"
          title="Click to pan right. Shift-click to scroll right more."
          />
        </div>
      <!-- scroll lock button -->
      <div class="flexrow">
        <m-button
          :icon="context.scrollLock ? 'lock' : 'lock_open'"
          @click="context.scrollLock = !context.scrollLock"
          :title="context.scrollLock ? 'Lockstep scrolling is ON. Click to turn OFF.' : 'Lockstep scrolling is OFF. Click to turn ON'"
          />
        </div>
      <!-- camera button -->
      <m-button
        icon="camera_alt"
        @click="$emit('camera-click', $event)"
        title="Click to download PNG image. Shift-click to download SVG."/>
    </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import MMenuItem from '@/components/MMenuItem'
import GenomeSelector from '@/components/GenomeSelector'
import ToolbarMenu from '@/components/ToolbarMenu'
import gc from '@/lib/GenomeCoordinates'
import u from '@/lib/utils'
export default MComponent({
  name: 'ZoomControls',
  components: { MButton, MMenuItem, GenomeSelector, ToolbarMenu },
  props: [
    'context'
  ],
  data: function () {
    return {
      my: this.copyProps(),
      fixed: false,
      offset: 0
    }
  },
  mounted: function () {
    this.$el.closest('.page-box-container').addEventListener('scroll', () => {
      let bcr = this.$parent.$el.getBoundingClientRect()
      this.fixed = bcr.top < 60
      this.offset = this.fixed ? -bcr.top + 60 : 0
    })
  },
  methods: {
    copyProps () {
      return Object.assign({rGenome: this.context.rGenome}, this.context.coords, this.context.lcoords)
    },
    blurOnEnter (e) {
      if (e.keyCode === 13) e.target.blur()
    },
    findLandmark (n) {
      if (!n) return
      const f = this.dataManager.getFeaturesBy(n)[0]
      if (f) {
        // user entered a valid symbol
        this.$root.$emit('feature-align', { feature: f })
      } else {
        // not a valid symbol. try parsing as coords.
        const c = gc.parse(n)
        if (c) {
          this.$root.$emit('jump-to', { coords: c })
        } else {
          alert('Landmark not found: ' + n)
        }
      }
      this.$refs.searchBox.value = ''
    }
  }
})
</script>

<style scoped>
.zoom-controls {
    flex-wrap: wrap;
}
.zoom-controls.fixed {
    z-index: 100;
    background-color: #ccc;
    border-radius: 2px;
    padding-top: 8px;
}
.zoom-controls > .flexrow {
    justify-content: flex-start;
    flex-grow: 0;
}
</style>
