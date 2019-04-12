<template>
    <div
      class="zoom-controls flexrow"
      :class="{ fixed: fixed }"
      :style="{ top: offset + 'px' }"
      >
      <div class="selector-container">
        <i class="material-icons">list</i>
        <genome-selector
          :allGenomes="context.allGenomes"
          :strips="context.strips"
          :genomeSets="context.genomeSets"
          />
      </div>
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
        @click="$root.$emit('camera-click','zoomview')"
        title="Download image."/>
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
    this.$watch('context', () => this.reset(), { 'deep': true })
    this.$el.closest('.page-box-container').addEventListener('scroll', () => {
      let bcr = this.$parent.$el.getBoundingClientRect()
      this.fixed = bcr.top < 60
      this.offset = this.fixed ? -bcr.top + 60 : 0
    })
  },
  computed: {
    formattedCoords: {
      get: function () {
        return `${this.my.chr.name}:${this.my.start}..${this.my.end}`
      },
      set: function (v) {}
    },
    alignedText: function () {
        if (!this.my.landmark) return ''
        let dtext = this.my.delta ? ` (${this.my.delta > 0 ? '+' : ''}${u.prettyPrintBases(this.my.delta)})` : ''
        return `Aligned on ${this.landmarkSymbol}${dtext}`
    },
    width: function () {
      return this.my.end - this.my.start + 1
    },
    landmarkSymbol: function () {
      if (!this.my.landmark) return ''
      return this.my.landmark
    }
  },
  methods: {
    copyProps () {
      return Object.assign({rGenome: this.context.rGenome}, this.context.coords, this.context.lcoords)
    },
    blurOnEnter (e) {
      if (e.keyCode === 13) e.target.blur()
    },
    validate (c, error) {
      try {
        let nc = gc.validate(c, this.my.rGenome, true)
        if (!nc) {
          this.reset(error)
          return
        }
        this.setCoordinates(nc)
      } catch (e) {
        this.reset(e)
      }
    },
    findLandmark (n) {
      if (!n) return
      const f = this.dataManager.getFeaturesBy(n)[0]
      if (f) {
        this.$root.$emit('feature-align', { feature: f })
      } else {
        const c = gc.parse(n)
        if (c) {
          this.$root.$emit('jump-to', { coords: c })
        } else {
          alert('Landmark not found: ' + n)
        }
      }
      this.$refs.searchBox.value = ''
    },
    setFormatted (c) {
      let coords = gc.parse(c)
      if (!coords) {
        let f = this.dataManager.getFeaturesBy(c)[0]
        if (f) {
          let lm = f.symbol || f.cID || f.ID
          this.$root.$emit('context', { landmark: lm, currentSelection: [f.cID || f.ID] })
          return
        }
        this.reset('Invalid coordinates. Please try again.')
        return
      }
      this.validate(coords, 'Invalid coordinates. Please try again.')
    },
    setWidth (w) {
      this.zoom((this.my.end - this.my.start + 1) / w)
    },
    zoom (amount) {
      this.validate(gc.zoom(this.my, amount), 'Invalid zoom factor. Please try again.')
    },
    pan (amount) {
      this.validate(gc.pan(this.my, amount), 'Invalid pan amount. Please try again.')
    },
    // ------------------------------------------------------
    setCoordinates (c) {
      let mp = (this.my.start + this.my.end) / 2
      let mp2 = (c.start + c.end) / 2
      this.my.chr = c.chr
      this.my.start = c.start
      this.my.end = c.end
      if (this.context.lcoords.landmark) {
        this.$root.$emit('context', {
          length: c.end - c.start + 1,
          delta: Math.round(this.context.lcoords.delta + (mp2 - mp))
        })
      } else {
        this.$root.$emit('context', c)
      }
    },
    //
    reset (message) {
      if (message) alert(message)
      this.my = this.copyProps()
      this.$forceUpdate()
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
.genome-selector {
  position: absolute;
  top: 15px;
  left: 15px;
  flex-grow: 0;
  width: 140px;
  background-color: #e0e0e0;
  display: none;
}
.selector-container:hover .genome-selector {
  display: flex;
}
</style>
