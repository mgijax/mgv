<template>
  <div class="settings flexcolumn">
  <form>
  <label>Features</label>
  <div
    title="Display all feature labels when view width is below threshold (3 Mb)."
    class="flexrow"
    >
    <label>Show all<sup title="When zoomed in">*</sup> labels</label>
    <input
        type="checkbox"
        v-model="ZoomRegion.showFeatureLabels"
        />
  </div>
  <div
    title="Set the font size of displayed feature labels."
    class="flexrow"
    >
    <label>Font size</label>
    <input
        type="range"
        v-model="ZoomRegion.featureFontSize"
        min="1"
        max="24"
        />
  </div>
  <div
    title="Set the thickness of rectangles used to represent features."
    class="flexrow"
    >
    <label>Height</label>
    <input
        type="range"
        v-model="ZoomRegion.featureHeight"
        min="1"
        max="24"
        />
  </div>
  <div
    title="Set the amount of space separating feature swim lanes."
    class="flexrow"
    >
    <label>Lane gap</label>
    <input
        type="range"
        v-model="ZoomRegion.laneGap"
        min="1"
        max="24"
        />
  </div>
  <div
    title="Reference point when aligned on a feature."
    class="flexrow"
    >
    <label>Align on</label>
    <select v-model="ZoomRegion.featureAlignment">
      <option value="5-prime">5-prime end</option>
      <option value="3-prime">3-prime end</option>
      <option value="proximal">proximal end</option>
      <option value="distal">distal end</option>
      <option value="midpoint">midpoint</option>
    </select>
  </div>
  <label>Transcripts</label>
  <!--
    WARNING: Making these threshold values editable gives the unwary user a VERY EASY way to
    crash their brower! Need to place appropriate restrictions/safeguards.
  -->
  <div
    title="Display exon structure when view width is below this value."
    class="flexrow">
    <label>Display threshold</label>
    <input
        min=0
        max=10000000
        step=1000000
        type="number"
        v-model="ZoomRegion.detailThreshold"
        />Mb
  </div>
  <div
    class="flexrow"
    title="Display all transcript labels when view width is below threshold (3 Mb) and 'Spread transcripts' is checked."
    >
    <label>Show labels</label>
    <input
        type="checkbox"
        v-model="ZoomRegion.showTranscriptLabels"
        />
  </div>
  <div
    class="flexrow"
    title="Sets the font size of displayed transcript labels."
    >
    <label>Font size</label>
    <input
        type="range"
        v-model="ZoomRegion.transcriptFontSize"
        min="1"
        max="24"
        />
  </div>
  <div
    class="flexrow"
    title="Show locations of start/stop codons."
    >
    <label>Show start/stop codons</label>
    <input
        type="checkbox"
        v-model="ZoomRegion.showStartStopCodons"
        />
  </div>
  <div
    title="When checked, spreads transcripts so you can see them all. When unchecked, piles them on top of one another for a compact view. In spread view, strand is indicated by arrows. In the collapsed view, strand is indicated by position above (+) or below (-) the axis line."
    class="flexrow"
    >
    <label>Spread transcripts</label>
    <input
        type="checkbox"
        v-model="ZoomRegion.spreadTranscripts"
        />
  </div>
  <label>Sequences</label>
  <div
    title="Display DNA sequence when view width is below this value."
    class="flexrow">
    <label>Display threshold</label>
    <input
        min=0
        max=10000
        step=100
        type="number"
        v-model="ZoomRegion.sequenceThreshold"
        />bp
  </div>
  <div
    title="Set the font size of displayed sequences."
    class="flexrow"
    >
    <label>Font size</label>
    <input
        type="range"
        v-model="ZoomRegion.sequenceFontSize"
        min="1"
        max="24"
        />
  </div>
  <label>Misc</label>
  <div
    title="When checked, shows a vertical reference line indicating the base position that follows the mouse around. When unchecked, only shows during drag operations."
    class="flexrow"
    >
    <label>Track mouse</label>
    <input
        type="checkbox"
        v-model="ZoomRegion.trackMouse"
        />
  </div>

  </form>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import KeyStore from '@/lib/KeyStore'
import config from '@/config'
export default MComponent({
  name: 'Settings',
  data: function () {
    return config
  },
  methods: {
    save: function () {
      return this.kstore.set('settings', this.$data)
    },
    restore: function () {
      return this.kstore.get('settings').then(settings => {
        if (settings === undefined) return
        Object.assign(this.$data, settings)
      })
    }
  },
  created: function() {
    this.kstore = new KeyStore(config.PreferencesManager.dbName)
    this.restore()
  },
  mounted: function () {
    this.$watch('$data', () => this.save(), {deep: true})
  }
})
</script>

<style scoped>
.settings {
  white-space: nowrap;
}
.flexrow {
  justify-content: space-between;
}
input {
  max-width: 65px;
}
</style>
