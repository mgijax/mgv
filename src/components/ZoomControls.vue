<template>
    <div
      class="zoom-controls flexrow"
      :class="{ fixed: fixed }"
      :style="{ top: offset + 'px' }"
      >
      <toolbar-menu
        :icon="menuData.icon"
        :label="menuData.label"
        :menuItems="menuData.menuItems"
        />
      <!-- coordinates box -->
      <div class="flexrow" name="coords">
        <label>{{my.rGenome.name}} coords</label>
        <div class="flexcolumn" style="align-items: flex-start;">
          <input
            size="24"
            v-model="formattedCoords"
            @keypress="blurOnEnter"
            @blur="setFormatted($event.target.value)"
            title="Enter coordinates (chr:start..end) or landmark (symbol or ID). Coordinates are relative to the reference genome and are mapped to corresponding region(s) in each comparison genome. Enter a landmark to find that feature and line up the displays."
            />
          <span
            name="alignedText"
            v-show="my.landmark"
            >
            <m-button
              icon="highlight_off"
              @click="noAlign"
              color="red"
              title="Stop aligning on this feature."
              style="font-size: 14px;"
              />
            Aligned on {{landmarkSymbol}}
          </span>
        </div>
      </div>
      <!-- width box -->
      <div class="flexrow">
        <label>Showing</label>
        <input
          size="12"
          :value="width"
          @keypress="blurOnEnter"
          @blur="setWidth(parseInt($event.target.value))"
          title="Shows the width in bp of the currently displayed reference genome region. Enter a smaller value to zoom in, larger to zoom out (or just click the zoom buttons)."
          />
        <span>bp</span>
      </div>
      <!-- zoom buttons -->
      <div class="flexrow">
        <label>Zoom</label>
        <m-button
          icon="zoom_in"
          @click="zoom(2 * cfg.defaultZoom)"
          style="font-weight:bold;"
          help="Zoom in more."/>
        <m-button
          icon="zoom_in"
          @click="zoom(cfg.defaultZoom)"
          help="Zoom in."/>
        <m-button
          icon="zoom_out"
          @click="zoom(1 / cfg.defaultZoom)"
          help="Zoom out."/>
        <m-button
          icon="zoom_out"
          @click="zoom(1 / (2 * cfg.defaultZoom))"
          style="font-weight:bold;"
          help="Zoom out more."/>
      </div>
      <!-- pan buttons -->
      <div class="flexrow">
        <label>Pan</label>
        <m-button
          icon="chevron_left"
          @click="pan(-5 * cfg.defaultPan)"
          style="font-weight:bold;"
          help="Pan left more."/>
        <m-button
          icon="chevron_left"
          @click="pan(-cfg.defaultPan)"
          help="Pan left."/>
        <m-button
          icon="chevron_right"
          @click="pan(cfg.defaultPan)"
          help="Pan right."/>
        <m-button
          icon="chevron_right"
          @click="pan(5 * cfg.defaultPan)"
          style="font-weight:bold;"
          help="Pan right more."/>
      </div>
    </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import MMenuItem from '@/components/MMenuItem'
import ToolbarMenu from '@/components/ToolbarMenu'
import gc from '@/lib/GenomeCoordinates'
export default MComponent({
  name: 'ZoomControls',
  components: { MButton, MMenuItem, ToolbarMenu },
  props: ['context'],
  data: function () {
    return {
      my: this.copyProps(),
      fixed: false,
      offset: 0
    }
  },
  mounted: function () {
    this.$watch('context', () => this.reset(), { 'deep': true })
    document.addEventListener('scroll', () => {
      let bcr = this.$parent.$el.getBoundingClientRect()
      this.fixed = bcr.top < -40
      this.offset = this.fixed ? -bcr.top : 0
    })
  },
  computed: {
    formattedCoords: {
      get: function () {
        return `${this.my.chr.name}:${this.my.start}..${this.my.end}`
      },
      set: function (v) {}
    },
    width: function () {
      return this.my.end - this.my.start + 1
    },
    landmarkSymbol: function () {
      if (!this.my.landmark) return ''
      return this.my.landmark
    },
    menuData: function () {
      return {
        icon: 'menu',
        menuItems: [{
          icon: 'open_in_new',
          label: 'SNPs@MGI',
          helpText: 'View SNPs at MGI for the current strains in the current region. (Some strains not available.)',
          handler: function () {
            let c = this.context.coords
            let urlBase = 'http://www.informatics.jax.org/snp/summary'
            let tabArg = 'selectedTab=1'
            let searchByArg = 'searchBySameDiff='
            let chrArg = `selectedChromosome=${c.chr.name}`
            let coordArg = `coordinate=${c.start}-${c.end}`
            let unitArg = 'coordinateUnit=bp'
            let csArgs = this.context.vGenomes.map(g => `selectedStrains=${g.name}`)
            let rsArg = `referenceStrain=${this.context.rGenome.name}`
            let linkUrl = `${urlBase}?${tabArg}&${searchByArg}&${chrArg}&${coordArg}&${unitArg}&${rsArg}&${csArgs.join('&')}`
            window.open(linkUrl, '_blank')
          }.bind(this)
        }, {
          icon: 'open_in_new',
          label: 'QTL@MGI',
          helpText: 'View QTL at MGI that overlap the current region.',
          handler: function () {
            let c = this.context.coords
            let urlBase = 'http://www.informatics.jax.org/allele/summary'
            let chrArg = `chromosome=${c.chr.name}`
            let coordArg = `coordinate=${c.start}-${c.end}`
            let unitArg = 'coordUnit=bp'
            let typeArg = 'alleleType=QTL'
            let linkUrl = `${urlBase}?${chrArg}&${coordArg}&${unitArg}&${typeArg}`
            window.open(linkUrl, '_blank')
          }.bind(this)
        }, {
          icon: 'open_in_new',
          label: 'JBrowse@MGI',
          helpText: 'Open MGI JBrowse (C57BL/6J GRCm38) with the current coordinate range.',
          handler: function () {
            let c = this.context.coords
            let urlBase = 'http://jbrowse.informatics.jax.org/'
            let dataArg = 'data=data%2Fmouse' // "data/mouse"
            let locArg = `loc=chr${c.chr.name}%3A${c.start}..${c.end}`
            let tracks = ['DNA', 'MGI_Genome_Features', 'NCBI_CCDS', 'NCBI', 'ENSEMBL']
            let tracksArg = `tracks=${tracks.join(',')}`
            let highlightArg = 'highlight='
            let linkUrl = `${urlBase}?${[dataArg, locArg, tracksArg, highlightArg].join('&')}`
            window.open(linkUrl, '_blank')
          }.bind(this)
        }]
      }
    }
  },
  methods: {
    copyProps () {
      return Object.assign({rGenome: this.context.rGenome}, this.context.coords, this.context.lcoords)
    },
    noAlign () {
      this.$root.$emit('context', { landmark: null })
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
}
.zoom-controls [name="alignedText"] {
  position: absolute;
  top: -16px;
  font-size: 12px;
}
</style>
