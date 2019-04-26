<template>
  <div class="settings flexcolumn">
  <form>
  <!-- ============== FEATURES section  ============== -->
  <label>Features</label>
  <!-- =================== -->
  <div
    title="Display all feature labels when view width is below display threshold."
    class="flexrow"
    >
    <label>Show all<sup title="When zoomed in">*</sup> labels</label>
    <input
        type="checkbox"
        v-model="ZoomRegion.showFeatureLabels"
        />
  </div>
  <!-- =================== -->
  <div
    title="Above this threshold, features are simply boxes. Below this threshold, exon structure becomes visible."
    class="flexrow">
    <label>Details threshold</label>
    <input
        min=0
        max=10000000
        step=1000000
        type="number"
        v-model="ZoomRegion.detailThreshold"
        />bp
  </div>
  <!-- =================== -->
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
  <!-- =================== -->
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
  <!-- =================== -->
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
  <!-- =================== -->
  <div
    title="Make selected features stand out more by fading unselected features."
    class="flexrow"
    >
    <label>Contrast</label>
    <input
        type="range"
        v-model="ZoomRegion.contrast"
        min="0"
        max=".9"
        step=".1"
        />
  </div>
  <!-- ============== TRANSCRIPTS section  ============== -->
  <label>Transcripts</label>
  <!-- =================== -->
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
  <!-- =================== -->
  <div
    class="flexrow"
    title="Display all transcript labels when view width is below display threshold and 'Spread transcripts' is checked."
    >
    <label>Show all<sup title="When zoomed in">*</sup> labels</label>
    <input
        type="checkbox"
        v-model="ZoomRegion.showTranscriptLabels"
        />
  </div>
  <!-- =================== -->
  <div
    class="flexrow"
    title="Set the font size of displayed transcript labels."
    >
    <label>Font size</label>
    <input
        type="range"
        v-model="ZoomRegion.transcriptFontSize"
        min="1"
        max="24"
        />
  </div>
  <!-- =================== -->
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
  <!-- ============== SEQUENCES section  ============== -->
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
  <!-- =================== -->
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
  <!-- ============== FIDUCIALS section  ============== -->
  <label>Connectors</label>
  <!-- =================== -->
  <div
    title="For highlighted features, show connectors between genologs."
    class="flexrow"
    >
    <label>Show connectors</label>
    <input
        type="checkbox"
        v-model="ZoomFiducials.showConnectors"
        />
  </div>
  <!-- =================== -->
  <div
    title="The opacity of the connector interior."
    class="flexrow"
    >
    <label>Fill opacity</label>
    <input
        type="range"
        v-model="ZoomFiducials.fillOpacity"
        min="0"
        max="0.4"
        step="0.01"
        />
  </div>
  <!-- =================== -->
  <div
    title="Controls how connectors are drawn between genomes. Only relevant when there are duplications, either due to evolution or simply because overlapping regions of the same genome are being displayed."
    class="flexrow"
    >
    <label>Connector style</label>
    <select v-model="ZoomFiducials.connectorStyle">
      <option value="linear">linear</option>
      <option value="combinatorial">combinatorial</option>
    </select>
  </div>
  <!-- ============== MISC section  ============== -->
  <label>Misc</label>
  <!-- =================== -->
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
  <!-- =================== -->
  <div
    title="Clears local data and preferences caches and reloads the page. Your lists and sequence cart are not affected."
    class="flexrow"
    >
    <label>Clear cache and reload</label>
    <m-button
      icon="refresh"
      @click="$root.$emit('clear-cache-and-reload')"
      color="#3a99fc"
      />
  </div>
  </form>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import KeyStore from '@/lib/KeyStore'
import config from '@/config'
import u from '@/lib/utils'
export default MComponent({
  name: 'Settings',
  components: { MButton },
  data: function () {
    return config
  },
  methods: {
    // saves current settings to database
    save: function () {
      return this.kstore.set('settings', this.$data)
    },
    // restores current settings after a page load
    // checks timestamps and either restores setting from cache,
    // or resets the cache to the lastest values
    restore: function (timestamp) {
      return this.kstore.get('settings').then(settings => {
        if (settings === undefined || settings.TIMESTAMP !== timestamp) {
          // save settings to cache
          return this.save()
        } else {
          // restore settings from cache
          Object.assign(this.$data, settings)
        }
      })
    }
  },
  created: function() {
    this.kstore = new KeyStore(config.PreferencesManager.dbName)
    this.restore(config.TIMESTAMP)
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
