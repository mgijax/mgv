<template>
  <div
    class="zoom-controls flexcolumn"
    >
    <div
      class="flexrow"
      >
      <!-- scroll lock button -->
      <div class="flexrow">
        <m-button
          :icon="context.activeFacets.length ? 'filter_alt' : 'filter_alt_off'"
          @click="clearFacets"
          :title="activeFacetsText"
          :style="{ color: context.activeFacets.length ? 'rgb(255, 127, 14)' : 'black' }"
          />
        <m-button
          :icon="context.scrollLock ? 'lock' : 'lock_open'"
          @click="lockClicked"
          :title="context.scrollLock ? 'Scroll lock is ON. Click to turn OFF.' : 'Scroll lock is OFF. Click to turn ON'"
          :style="{ color: context.scrollLock ? 'rgb(255, 127, 14)' : 'black' }"
          />
        <m-button
          icon="N"
          @click="app.toggleShowAllLabels()"
          :style="{ textDecoration: context.config.ZoomRegion.showFeatureLabels ? 'none' : 'line-through' }"
          title="Show/hide labels for all genes and transcripts."
          />
        <m-button
          :icon="expandBtnIcon"
          @click="app.toggleShowAllTranscripts()"
          title="Show transcripts for all genes, selected genes, or no genes."
          />
        <m-button
          :disabled="app.currentSelection.length === 0"
          icon="align_horizontal_left"
          @click="alignFeatures()"
          :title="(app.currentSelection.length === 0 ? 'Align disabled because no features are currently selected.' : 'Align the view around the currently selected feature(s).')"
          />
        <m-button
          icon="shopping_cart"
          title="Add all currently displayed regions to the SequenceCart. To add a single region, click the cart icon in that region's control panel (right click to open)."
          @click="addAllToCart()"
          />
        </div>
      <!-- Search box -->
      <div class="flexrow">
        <label
          title="Focus the view around a gene or jump to specific coordinates."
          >Find</label>
        <input
          ref="searchBox"
          size="28"
          placeholder="Enter symbol, ID, or coordinates."
          @keypress="submitOnEnter"
          @focus="selectOnFocus"
          />
        <div class="flexrow"
          :style="{cursor: 'pointer', opacity: paralogsEnabled ? 1 : 0.3}"
          @click="paralogsEnabled && app.toggleIncludeParalogs()"
          >
          <i class="material-icons"
            :style="{ opacity: app.includeParalogs && paralogsEnabled ? 0 : 1 }"
            >not_interested</i>
          <span
            :title="paralogsButtonTitle"
            :style="{
              position:'relative',
              left:'-21px',
              top: '2px',
              fontWeight: 'bold',
              fontStyle: 'normal',
              color: app.includeParalogs && paralogsEnabled ? 'rgb(255, 127, 14)' : 'black'
              }"
            >P</span>
          </div>
      </div>
      <!-- zoom/scroll controls -->
      <div class="flexrow">
        <m-button
          icon="zoom_in"
          @click="zoom($event.shiftKey ? 0.1 : 0.5)"
          title="Click to zoom in. Shift-click to zoom in more"
          />
        <m-button
          icon="zoom_out"
          @click="zoom($event.shiftKey ? 10 : 2)"
          title="Click to zoom out. Shift-click to zoom out more"
          />
        <m-button
          icon="chevron_left"
          @click="scroll($event.shiftKey ? -0.8 : -0.2)"
          title="Click to scroll left. Shift-click to scroll left more."
          />
        <m-button
          icon="chevron_right"
          @click="scroll($event.shiftKey ? 0.8 : 0.2)"
          title="Click to scroll right. Shift-click to scroll right more."
          />
      </div>
      <div class="flexrow">
        <!-- sort button -->
        <m-button
          :icon="'sort'"
          :title="'Sort genomes by name'"
          @click="$root.ebus.emit('sort-strips', 'name')"
          />
        <!-- camera button -->
        <m-button
          icon="camera_alt"
          @click="$emit('camera-click', $event)"
          title="Click to download PNG image. Shift-click to download SVG."/>
      </div>
    </div>
    <div
      class="flexrow current-selection-label"
      >
      <!-- Current list -->
      <div class="flexrow" v-if="context.currentList">
        Current list:
        <span
          v-if="context.currentList"
          class="listGlyph"
          :style="{ backgroundColor: context.currentList.color }"
          />{{context.currentList.name}}
          <m-button
            icon="highlight_off"
            title="Click to clear current list."
            color="red"
            @click="clearList"
            style="font-size: 12px;"
            />
      </div>
      <div v-else>No current list</div>
      <span style="flex-grow: 1;"></span>
      <!-- Current selection -->
      <div>
        <span v-if="app.currentSelectionLabel.length > 0">
          <m-button
            icon="highlight_off"
            title="Click to deselect."
            color="red"
            @click="clearSelection"
            style="font-size: 12px;"
            />
          Selected {{ app.currentSelectionLabel }}</span>
        <span v-else>Nothing selected.</span>
      </div>
    </div>
  </div>  
</template>

<script>
import MComponent     from './MComponent.js'
import MButton        from './MButton.vue'
import MMenuItem      from './MMenuItem.vue'
import GenomeSelector from './GenomeSelector.vue'
import gc             from '../lib/GenomeCoordinates.js'
import u              from '../lib/utils.js'
export default MComponent({
  name: 'ZoomControls',
  components: { MButton, MMenuItem, GenomeSelector },
  props: [
    'context'
  ],
  inject: ['dataManager'],
  computed: {
    expandBtnIcon: function () {
      switch (this.app.config.ZoomRegion.showWhichTranscripts) {
      case 0:
          return "dehaze"
      case 1:
          return "view_day"
      case 2:
          return "view_agenda"
      }
    },
    currListTitle: function () {
      const clist = this.context.currentList
      if (!clist) return 'No current list.'
      const clen = clist.items.length 
      const cglen = this.currentListHomologs.length
      const s = clen === 1 ? '' : 's'
      const sz = cglen === clen ? `${clen} item${s}` : `${cglen} of ${clen} item${s} found in this genome`
      const lim = cglen > this.maxListLength ? ` ${this.maxListLength} shown` : ''
      return `${clist.name} (${sz}${lim})`
    },
    activeFacetsText: function () {
      if (this.context.activeFacets.length === 0) return "No active filters."
      return "Active filters (click to remove):\n" + this.context.activeFacets.map(f => {
        return `${f.facet} [${f.values.join(", ")}]`
      }).join("\n")
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
  },
  methods: {
    clearList: function () {
      this.$root.ebus.emit('list-click', { list: this.context.currentList })
    },
    clearSelection: function () {
      this.$root.ebus.emit('clear-selection')
    },
    selectOnFocus (e) {
      e.target.select()
    },
    clearFacets: function () {
      this.$root.ebus.emit('clear-facets')
    },
    submitOnEnter (e) {
      if (e.keyCode === 13) this.findLandmark(e.target.value, e.shiftKey)
    },
    scroll (amt) {
      this.$root.ebus.emit('region-change', { op: 'scroll', amt: amt, sType: "%" })
    },
    zoom (amt) {
      this.$root.ebus.emit('region-change', { op: 'zoom', amt: amt })
    },
    lockClicked () {
      this.$root.ebus.emit('region-change', { op : this.context.scrollLock ? 'clear-lock-mode' : 'set-lock-mode'})
    },
    alignFeatures (fs, shift) {
        fs = fs || this.app.currentSelection
        this.$root.ebus.emit('region-change', { op : 'feature-align', features: fs, shift: shift })
    },
    addAllToCart () {
      const strips = this.$parent.$refs.main.$refs.strips
      const regions = u.flatten(strips.map(s => s.$children))
      const descs = regions.map(r => r.getSequenceDescriptor())
      this.$root.ebus.emit('sequence-selected', { sequences : descs, unselectAll: true })
    },
    findLandmark (n, shift) {
      if (!n) return
      const fs = u.flatten(n.replaceAll(",", " ").trim().split(/\s+/).map(nn => {
        const fss = this.dataManager().getFeaturesBy(nn.trim())
        return fss.filter(f => this.app.vGenomes.indexOf(f.genome) !== -1)
      }))
      if (fs.length > 0) {
        this.alignFeatures(fs, shift)
      } else {
        // not a valid symbol. try parsing as coords.
        const c = gc.parse(n)
        if (c) {
          // valid coords. 
          this.$root.ebus.emit('region-change', { op: 'jump-to', coords: c })
        } else {
          // No luck. Complain...
          alert('Landmark not found: ' + n)
        }
      }
    }
  }
})
</script>

<style scoped>
.zoom-controls {
    flex-wrap: wrap;
    position: -webkit-sticky; /* Safari */
    position: sticky;
    top: 18px;
    background-color: var(--main-bg-color);
    border: thin solid #c8c8c8;
    margin-bottom: 8px;
}
.zoom-controls > * > .flexrow {
    justify-content: flex-start;
    flex-grow: 0;
}
.current-selection-label {
  font-size: 12px;
}
.listGlyph {
  width: 6px;
  height: 6px;
  border-radius: 6px;
  border: thin solid black;
  display: inline-block;
  margin-left: 6px;
}
</style>
