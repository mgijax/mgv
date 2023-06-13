<template>
  <div
    class="zoom-view"
    @contextmenu.stop.prevent="showContextMenu($event)"
    >
    <zoom-controls
      ref="controls"
      :context="context"
      @camera-click="cameraClick"
      />
    <zoom-region-controls
      ref="regionControls"
      />
    <zoom-main
      ref="main"
      :context="context"
      />
    <m-menu
      :menuItems="contextMenu"
      ref="contextMenu"
      :title="menuTitle"
      :contextObject="contextObject"
      :closeButton="true"
      />
    <variant-info
      ref="variantInfo"
      />
  </div>
</template>

<script>
import MComponent         from './MComponent.js'
import ZoomControls       from './ZoomControls.vue'
import ZoomRegionControls from './ZoomRegionControls.vue'
import ZoomMain           from './ZoomMain.vue'
import VariantInfo        from './VariantInfo.vue'
import MMenu              from './MMenu.vue'
import getFeatureMenus    from '../lib/ZoomViewContextMenu.js'
export default MComponent({
  name: 'ZoomView',
  props: ['context'],
  inject: ['dataManager'],
  components: { ZoomControls, ZoomRegionControls, ZoomMain, MMenu, VariantInfo },
  data: function () {
    return {
      contextMenu: [],
      contextObject: null,
      // taxonid -> feature context menu
      featureMenu: getFeatureMenus(this),
    }
  },
  computed: {
    menuTitle: function () {
      const cxt = this.contextObject
      if (cxt && cxt.feature) {
        return [
          cxt.feature.label,
          cxt.feature.long_name || '',
          cxt.feature.type || '',
          cxt.feature.curie || cxt.feature.ID, 
          cxt.transcript ? cxt.transcript.label : '',
          cxt.transcript && cxt.transcript.cds ? cxt.transcript.cds.label : ''
        ]
      } else {
        return ['']
      }
    }
  },
  methods: {
    getTopStrip: function () {
      return this.$refs.main.getTopStrip()
    },
    cameraClick: function (e) {
      this.$refs.main.downloadImage(e)
    },
    showContextMenu: function (evt) {
      const rnode = evt.target.closest('.zoom-region')
      const fnode = evt.target.closest('.feature')
      const vnode = evt.target.closest('.variant')
      const vm = rnode ? rnode.__vue__ : null
      if (!vm) return
      const y = evt.clientY // - cbb.y
      const x = evt.clientX // - cbb.x
      if (fnode) {
        // Before showing f's context menu, be sure its model has been read into the cache.
        // Also be sure same is true of all visible homologs of f
        const dm = this.dataManager()
        const f = dm.getFeatureById({name:fnode.getAttribute('genome')}, fnode.getAttribute('name'))
        const fhoms = dm.getHomologs(f)
        const fhomPs = fhoms.map(h => dm.getGenes(h.genome, h.chr, h.start, h.end, true))
        Promise.all(fhomPs).then(() => {
          const tnode = evt.target.closest('.transcript')
          const tid = tnode ? tnode.getAttribute('name') : ''
          const t = tnode ? f.transcripts.filter(t => t.ID === tid)[0] : null
          this.contextObject = { event: evt, vm: vm, feature: f, transcript: t }
          this.contextMenu = (this.featureMenu[f.genome.taxonid] || this.featureMenu['default'])
          const cm = this.$refs.contextMenu
          cm.open(y, x)
        })
      } else if (vnode) {
        const vid = vnode.getAttribute('name')
        const v = vm.variants.filter(vv => vv.ID === vid)[0]
        if (v) this.$refs.variantInfo.open( v, y, x)
      } else {
        this.$refs.regionControls.open(vm, y-2, x-2)
      }
    }
  }
})
</script>

<style scoped>
</style>
