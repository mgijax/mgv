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
      />
    <m-menu
      :menuItems="contextMenu"
      ref="contextMenu"
      :title="menuTitle"
      :contextObject="contextFeature"
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
export default MComponent({
  name: 'ZoomView',
  props: ['context'],
  components: { ZoomControls, ZoomMain, MMenu },
  data: function () {
    return {
      contextMenu: [],
      contextFeature: null,
      backgroundMenu: [],
      // main menu in the ZoomView
      mainMenu: getMainMenu(this),
      // taxonid -> feature context menu
      featureMenu: getFeatureMenus(this),
    }
  },
  computed: {
    menuTitle: function () {
      const cxt = this.contextFeature
      const lbl = cxt ? cxt.feature.label : ''
      const glbl = cxt ? cxt.feature.ID : ''
      const tlbl = cxt && cxt.transcript ? cxt.transcript.ID : ''
      const plbl = cxt && cxt.transcript && cxt.transcript.cds ? cxt.transcript.cds.ID : ''
      return [lbl, glbl, tlbl, plbl]
    }
  },
  methods: {
    showContextMenu: function (evt) {
      const fnode = evt.target.closest('.feature')
      if (!fnode) return
      const f = fnode ? this.dataManager.getFeatureById(fnode.getAttribute('name')) : null

      const tnode = evt.target.closest('.transcript')
      const tid = tnode ? tnode.getAttribute('name') : ''
      const t = tnode ? f.transcripts.filter(t => t.ID === tid)[0] : null
      
      this.contextFeature = { feature: f, transcript: t }
      this.contextMenu = f ? (this.featureMenu[f.genome.taxonid] || this.featureMenu['default']) : this.backgroundMenu
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
