<template>
  <div class="settings flexcolumn">
  <form>
  <div class="flexrow">
    <label>Feature height</label>
    <input
        type="range"
        v-model="ZoomRegion.featureHeight"
        min="1"
        max="24"
        />
  </div>
  <div class="flexrow">
    <label>Feature labels</label>
    <input
        type="checkbox"
        v-model="ZoomRegion.showFeatureLabels"
        />
  </div>
  <div class="flexrow">
    <label>Feature font size</label>
    <input
        type="range"
        v-model="ZoomRegion.featureFontSize"
        min="1"
        max="24"
        />
  </div>
  <div class="flexrow">
    <label>Lane gap</label>
    <input
        type="range"
        v-model="ZoomRegion.laneGap"
        min="1"
        max="24"
        />
  </div>
  <div class="flexrow">
    <label>Transcript labels</label>
    <input
        type="checkbox"
        v-model="ZoomRegion.showTranscriptLabels"
        />
  </div>
  <div class="flexrow">
    <label>Transcript font size</label>
    <input
        type="range"
        v-model="ZoomRegion.transcriptFontSize"
        min="1"
        max="24"
        />
  </div>
  <!--
    WARNING: Making these threshold values editable gives the unwary user a VERY EASY way to
    crash their brower! Probably best to keep these hidden.

  <div class="flexrow">
    <label>Details threshold</label>
    <input
        type="number"
        v-model="ZoomRegion.detailThreshold"
        />
  </div>
  <div class="flexrow">
    <label>Sequence threshold</label>
    <input
        type="number"
        v-model="ZoomRegion.sequenceThreshold"
        />
  </div>
  -->
  <div class="flexrow">
    <label>Spread transcripts</label>
    <input
        type="checkbox"
        v-model="ZoomRegion.spreadTranscripts"
        />
  </div>
  <div class="flexrow">
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
import config from '@/config'
export default MComponent({
  name: 'Settings',
  data: function () {
    return config
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
