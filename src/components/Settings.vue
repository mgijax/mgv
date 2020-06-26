<template>
  <div class="settings flexcolumn">
  <form>
  <!-- ============== FEATURES section  ============== -->
  <div class="section"><label>Genomes</label></div>
  <!-- =================== -->
  <div
    title="Set the amount of space between genomes/strips"
    class="flexrow"
    >
    <label>Gap</label>
    <input
        type="range"
        v-model="ZoomMain.stripGap"
        min="25"
        max="125"
        />
  </div>

  <!-- ============== FEATURES section  ============== -->
  <div class="section"><label>Features</label></div>
  <!-- =================== -->
  <div
    title="Above this threshold, features are simply boxes. Below this threshold, exon structure becomes visible."
    class="flexrow">
    <label>Details threshold</label>
    <input
        min=0
        max=10
        step=1
        type="number"
        v-model="thresholdMb"
        />Mbp
  </div>
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
  <!-- =================== 
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
  -->
  <!-- ============== TRANSCRIPTS section  ============== -->
  <div class="section"><label>Transcripts</label></div>
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
  <div class="section"><label>Sequences</label></div>
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
  <div class="section"><label>Homology Connections</label></div>
  <!-- =================== -->
  <div
    title="For selected features, show connectors between homologs."
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
    :title="paralogsButtonTitle"
    class="flexrow"
    :style="{ opacity: paralogsEnabled ? 1 : 0.3 }"
    >
    <label>Infer paralogs</label>
    <input
        type="checkbox"
        v-model="MGV.includeParalogs"
        />
  </div>
  <!-- =================== -->
  <div
    title="Draw inversions with a twist and a different color."
    class="flexrow"
    >
    <label>Highlight inversions</label>
    <input
        type="checkbox"
        v-model="ZoomFiducials.showInversions"
        />
  </div>
  <!-- =================== -->
  <div
    title="Make connected features stand out more by fading unconnected features."
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
  <!-- ============== MISC section  ============== -->
  <div class="section"><label>Misc</label></div>
  <!-- =================== -->
  <div
    title="When checked, shows a vertical reference line indicating the base position that follows the mouse around. When unchecked, only shows during drag operations."
    class="flexrow"
    >
    <label>Track mouse</label>
    <input
        type="checkbox"
        v-model="RangeBoxes.trackMouse"
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
  <!-- =================== -->
  <div
    title="Purges all data for this MGV instance and exits. Includes lists, sequence cart items, preferences, and cached data."
    class="flexrow"
    >
    <label>Purge and exit</label>
    <m-button
      icon="eject"
      @click="$root.$emit('purge-and-exit')"
      color="#fc3a3a"
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
  },
  computed: {
    thresholdMb: {
      get: function () {
        return this.ZoomRegion.detailThreshold / 1000000
      },
      set: function (v) {
        this.ZoomRegion.detailThreshold = parseInt(v) * 1000000
      }
    },
    paralogsEnabled: function () {
      return this.app.vTaxons.length > 1
    },
    paralogsButtonTitle: function () {
      return this.paralogsEnabled ?
        (this.app.includeParalogs ?
            'Inferred paralogs are being included in searches, drawing, selecting, etc. Click to exclude.'
            :
            'Inferred paralogs are not being included in searches, drawing, selecting, etc. Click to include.')
        :
        'Cannot infer paralogs because only one species is being displayed.'
    }

  }
})
</script>

<style scoped>
.settings {
  white-space: nowrap;
}
.section {
  width: 100%;
  background-color: #f1f1f1;
}
.flexrow {
  justify-content: space-between;
}
input {
  max-width: 165px;
}
</style>
