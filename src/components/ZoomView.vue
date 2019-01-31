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
      />
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import ZoomControls from '@/components/ZoomControls'
import ZoomMain from '@/components/ZoomMain'
import MMenu from '@/components/MMenu'
import svg2png from '@/lib/Svg2Png'
import { connections } from '@/lib/InterMineServices'
import getMainMenu from '@/components/ZoomViewMainMenu'
import getFeatureMenu from '@/components/ZoomViewContextMenu'
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
      // feature context menu
      featureMenu: getFeatureMenu(this),
    }
  },
  computed: {
    menuTitle: function () {
      return this.contextFeature ? this.contextFeature.label : ''
    }
  },
  methods: {
    showContextMenu: function (evt) {
      let fnode = evt.target.closest('.feature')
      if (!fnode) return
      this.contextMenu = fnode ? this.featureMenu : this.backgroundMenu
      this.contextFeature = fnode ? this.dataManager.getFeatureById(fnode.getAttribute('name')) : null
      let cm = this.$refs.contextMenu
      let cbb = this.$el.getBoundingClientRect()
      let top = evt.clientY - cbb.y
      let left = evt.clientX - cbb.x
      cm.open(top, left)
    }
  }
})
</script>

<style scoped>
</style>
