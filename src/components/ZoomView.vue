<template>
  <div
    class="zoom-view"
    @contextmenu.stop.prevent="showContextMenu($event)"
    >
    <zoom-controls
      ref="controls"
      :context="context"
      :menuData="mainMenu"
      />
    <zoom-main
      ref="main"
      :context="context"
      :lockStepScrolling="context.dmode === 'landmark'"
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
import ZoomMain from '@/components/ZoomMain'
import MMenu from '@/components/MMenu'
import { connections } from '@/lib/InterMineServices'
import getMainMenu from '@/components/ZoomViewMainMenu'
import getFeatureMenus from '@/components/ZoomViewContextMenu'
import getRegionMenu from '@/components/ZoomViewRegionMenu'
export default MComponent({
  name: 'ZoomView',
  props: ['context'],
  components: { ZoomControls, ZoomMain, MMenu },
  data: function () {
    return {
      contextMenu: [],
      contextObject: null,
      // main menu in the ZoomView
      mainMenu: getMainMenu(this),
      // context menu for a region
      backgroundMenu: getRegionMenu(this),
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
      } else if (cxt && cxt.vm) {
        const r = cxt.vm.region
        return [
        'Region',
        `${r.genome.name}::${r.chr.name}:${r.start}..${r.end}`
        ]
      } else {
        return ['']
      }
    }
  },
  methods: {
    showContextMenu: function (evt) {
      const rnode = evt.target.closest('.zoom-region')
      const fnode = evt.target.closest('.feature')
      const vm = rnode ? rnode.__vue__ : null
      if (!vm) return
      if (fnode) {
        const f = this.dataManager.getFeatureById(fnode.getAttribute('name'))
        const tnode = evt.target.closest('.transcript')
        const tid = tnode ? tnode.getAttribute('name') : ''
        const t = tnode ? f.transcripts.filter(t => t.ID === tid)[0] : null
        this.contextObject = { vm: vm, feature: f, transcript: t }
        this.contextMenu = (this.featureMenu[f.genome.taxonid] || this.featureMenu['default'])
      } else {
        this.contextObject = { vm: vm }
        this.contextMenu = this.backgroundMenu
      }
      const cm = this.$refs.contextMenu
      const cbb = this.$el.getBoundingClientRect()
      const x = evt.clientY - cbb.y
      const y = evt.clientX - cbb.x
      cm.open(x, y)
    }
  }
})
</script>

<style scoped>
</style>
