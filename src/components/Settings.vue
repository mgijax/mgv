<template>
  <div class="settings flexcolumn">
  <form>
  <!-- ============== LAYOUT section  ============== -->
  <div class="section"><label>Sizes</label></div>
  <!-- =================== -->
  <div
    title="Set the amount of space between genomes/strips"
    class="flexrow"
    >
    <label>Genome gap</label>
    <input
        type="range"
        v-model="ZoomMain.stripGap"
        min="25"
        max="125"
        @mouseup="announce"
        />
  </div>
  <!-- =================== -->
  <div
    title="Set the amount of space separating transcripts of a gene."
    class="flexrow"
    >
    <label>Transcript gap</label>
    <input
        type="range"
        v-model="ZoomRegion.laneGap"
        min="1"
        max="24"
        @mouseup="announce"
        />
  </div>
  <!-- =================== -->
  <div
    title="Sets the font size of displayed feature labels."
    class="flexrow"
    >
    <label>Font size</label>
    <input
        type="range"
        v-model="ZoomRegion.featureFontSize"
        min="1"
        max="24"
        @mouseup="announce"
        />
  </div>
  <!-- =================== -->
  <div
    title="Sets the thickness of rectangles used to represent features."
    class="flexrow"
    >
    <label>Exon thickness</label>
    <input
        type="range"
        v-model="ZoomRegion.featureHeight"
        min="1"
        max="24"
        @mouseup="announce"
        />
  </div>
  <!-- ============== FEATURES section  ============== -->
  <div class="section"><label>Features</label></div>
  <!-- =================== -->
  <div
    title="Shows labels for all features. When unchecked, only shows labels for selected features."
    class="flexrow"
    >
    <label>Show all feature labels</label>
    <input
        type="checkbox"
        v-model="ZoomRegion.showFeatureLabels"
        @change="announce"
        />
  </div>
  <!-- =================== -->
  <div
    title="When viewing a region smaller than the threshold (ie, when zoomed in), gene structure is visible. When zoomed out, genes are simply boxes."
    class="flexrow">
    <label>Details threshold (Mbp)</label>
    <input
        size=5
        min=0
        max=10
        step=1
        type="number"
        v-model="ZoomRegion.detailThreshold"
        @change="announce"
        />
  </div>
  <!-- =================== -->
  <div
    title="Which features to expand so that transcripts are shown. The X key can also be used."
    class="flexrow"
    >
    <label>Expand to show transcripts</label>
    <select
      v-model="ZoomRegion.showWhichTranscripts"
      @change="announce"
      >
      <option :value="2">All</option>
      <option :value="1">Selected</option>
      <option :value="0">None</option>
    </select>
  </div>
  <!-- =================== -->
  <div
    class="flexrow"
    title="When showing transcript labels, show the Protein ID if the transcript is a CDS."
    >
    <label>Show protein labels</label>
    <input
        type="checkbox"
        v-model="ZoomRegion.showProteinLabels"
        @change="announce"
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
        @change="announce"
        />
  </div>
  <!-- =================== -->
  <div
    title="Make highlighted features stand out more by fading all other features."
    class="flexrow"
    >
    <label>Contrast</label>
    <input
        type="range"
        v-model="ZoomRegion.contrast"
        min="0"
        max=".9"
        step=".1"
        @mouseup="announce"
        />
  </div>
  <!-- ============== FIDUCIALS section  ============== -->
  <div class="section"><label>Homology Connections</label></div>
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
        @change="announce"
        />
  </div>
  <!-- =================== -->
  <div
    title="For selected features, show connectors between homologs."
    class="flexrow"
    >
    <label>Show connectors</label>
    <input
        type="checkbox"
        v-model="ZoomFiducials.showConnectors"
        @change="announce"
        />
  </div>
  <!-- =================== -->
  <div
    title="Show warning messages when homologs of highlighted features are either off-screen or missing from a genome."
    class="flexrow"
    >
    <label>Show warnings</label>
    <input
        type="checkbox"
        v-model="ZoomFiducials.showWarnings"
        @change="announce"
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
        @change="announce"
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
        max="0.2"
        step="0.01"
        @mouseup="announce"
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
    announce: function () {
      this.$root.$emit("context-changed")
    },
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
    },
    valToParam: function(val, type) {
        switch (type) {
        case 'b':
            return val ? "1" : "0"
        case 'n':
            return ""+val
        case 's':
        default:
            return val
        }
    },
    paramToVal: function (param, type) {
        switch (type) {
        case 'b':
            return param === "1"
        case 'n':
            return parseFloat(param)
        case 's':
        default:
            return param
        }
    },
    getSettingVal: function (obj, path) {
        return path.split(".").reduce((a,v) => a[v], obj)
    },
    setSettingVal: function(obj, path, val) {
        const parts = path.split(".")
        for(let i = 0 ; i < parts.length - 1 ; i++){
            obj = obj[parts[i]]
        }
        obj[parts[parts.length - 1]] = val
    },
    getContextString: function () {
        const parms = this.settingsInfo.map(si => {
            const pname = si[1]
            const v = this.getSettingVal(this, si[0])
            const pval = this.valToParam(v, si[2])
            return `${pname}:${pval}`
        })
        return parms.join(',')
    },
    setContextFromString: function (cxt) {
        cxt.split(",").forEach(s => {
            const nv = s.split(":")
            if (nv.length != 2) return
            const n = nv[0]
            const v = nv[1]
            const si = this.settingsIndex[n]
            if (si) this.setSettingVal(this, si[0], this.paramToVal(v, si[2]))
        })
    }
  },
  created: function() {
    this.kstore = new KeyStore(config.PreferencesManager.dbName)
    this.restore(config.TIMESTAMP)
  },
  mounted: function () {
    this.$watch('$data', () => this.save(), {deep: true})
    this.$watch('ZoomRegion.featureFontSize', () => {
      const zr = this.ZoomRegion
      zr.transcriptFontSize = zr.featureFontSize - 1
      zr.sequenceFontSize = zr.featureFontSize - 1
    })
    this.$watch('ZoomFiducials.showAllConnectors', () => {
      this.$root.$emit('zoom-main-updated')
    })
  },
  computed: {
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
    },
    settingsIndex: function () {
        return this.settingsInfo.reduce((a,v) => {
            a[v[1]] = v
            return a
        }, {})
    },
    settingsInfo: function () {
      // Defines the settings that are settable via URL.
      // Each entry has a path, a parameter name, and a type
      // indicator. 
      //   path = the path from this to the setting
      //   name = the parameter name to use in the URL
      //   type = "n" numeric; "b" boolean; "s" string
      // 
      return [
        ["ZoomMain.stripGap",               "gg", "n"], // gap between genomes (strips)
        ["ZoomRegion.laneGap",              "tg", "n"], // gap between transcripts
        ["ZoomRegion.detailThreshold",      "fd", "n"], // below this range, show gene model; above, just rectangles
        ["ZoomRegion.showFeatureLabels",    "fl", "b"], // show all feature labels
        ["ZoomRegion.featureFontSize",      "ff", "n"], // feature font size
        ["ZoomRegion.featureHeight",        "fh", "n"], // feature height (ie height of rectangles used to draw exons)
        ["ZoomRegion.showWhichTranscripts", "tx", "n"], // whether to show all transcripts (2), just selected ones (1), or none (0)
        ["ZoomRegion.showProteinLabels",    "pl", "b"], // if true, displays protein label, if the transcript is a CDS
        ["ZoomRegion.showStartStopCodons",  "tc", "b"], // if true, displays glyphs marking transcript start/stop sites
        ["ZoomFiducials.showConnectors",    "h",  "b"], // if true, displays connectors between (visible) homologs
        ["ZoomFiducials.fillOpacity",       "ho", "n"], // opacity of fill color for connectors
        ["ZoomFiducials.showInversions",    "hi", "b"], // if true, draws inversions with a twist and in a different color
        ["ZoomRegion.contrast",             "hc", "n"]  // amount to fade un-selected features
      ]
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
input[type="range"] {
  width: 100px;
}
</style>
