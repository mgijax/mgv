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
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import ZoomControls from '@/components/ZoomControls'
import ZoomRegionControls from '@/components/ZoomRegionControls'
import ZoomMain from '@/components/ZoomMain'
import MMenu from '@/components/MMenu'
import { connections } from '@/lib/InterMineServices'
import getFeatureMenus from '@/lib/ZoomViewContextMenu'
export default MComponent({
  name: 'ZoomView',
  props: ['context'],
  components: { ZoomControls, ZoomRegionControls, ZoomMain, MMenu },
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
          cxt.feature.ID, 
          cxt.transcript ? cxt.transcript.ID : '',
          cxt.transcript && cxt.transcript.cds ? cxt.transcript.cds.ID : ''
        ]
      } else {
        return ['']
      }
    }
  },
  methods: {
    cameraClick: function (e) {
      this.$refs.main.downloadImage(e)
    },
    showContextMenu: function (evt) {
      const rnode = evt.target.closest('.zoom-region')
      const fnode = evt.target.closest('.feature')
      const vm = rnode ? rnode.__vue__ : null
      if (!vm) return
      const cbb = this.$el.getBoundingClientRect()
      const y = evt.clientY // - cbb.y
      const x = evt.clientX // - cbb.x
      if (fnode) {
        const f = this.dataManager.getFeatureById(fnode.getAttribute('name'))
        const tnode = evt.target.closest('.transcript')
        const tid = tnode ? tnode.getAttribute('name') : ''
        const t = tnode ? f.transcripts.filter(t => t.ID === tid)[0] : null
        this.contextObject = { event: evt, vm: vm, feature: f, transcript: t }
        this.contextMenu = (this.featureMenu[f.genome.taxonid] || this.featureMenu['default'])
        const cm = this.$refs.contextMenu
        cm.open(y, x)
      } else {
        this.$refs.regionControls.open(vm.region, y, x)
      }
    }
  }
})
</script>

<style scoped>
</style>
