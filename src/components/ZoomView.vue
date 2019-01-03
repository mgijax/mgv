<template>
  <div
    class="zoom-view"
    @contextmenu.stop.prevent="showContextMenu($event)"
    >
    <zoom-controls
      ref="controls"
      :context="context"
      />
    <zoom-main
      ref="main"
      :context="context"
      />
    <m-menu
      :menuItems="contextMenu"
      ref="contextMenu"
      :title="menuTitle"
      />
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import ZoomControls from '@/components/ZoomControls'
import ZoomMain from '@/components/ZoomMain'
import MMenu from '@/components/MMenu'
export default MComponent({
  name: 'ZoomView',
  props: ['context'],
  components: { ZoomControls, ZoomMain, MMenu },
  data: function () {
    return {
      contextMenu: [],
      contextFeature: null,
      backgroundMenu: [{
        icon: 'settings',
        disabled: false,
        label: 'Background'
      }],
      featureMenu: [{
        icon: 'format_align_center',
        label: 'Align on this feature',
        disabled: false,
        helpText: 'Aligns the displayed genomes around this feature.',
        handler: () => {
          let f = this.contextFeature
          this.$root.$emit('context', { landmark: f.id, delta: 0, currentSelection: [f.cID], ref: f.genome })
        }
      }, {
        icon: 'open_in_new',
        label: 'Feature@MGI',
        helpText: 'See details for this feature at MGI.',
        disabled: false,
        handler: () => {
          let url = `http://www.informatics.jax.org/accession/${this.contextFeature.id}`
          window.open(url, '_blank')
        }
      }, {
        icon: 'open_in_new',
        label: 'Feature@MouseMine',
        helpText: 'See details for this feature at MouseMine.',
        disabled: false,
        handler: () => {
          let url = `http://www.mousemine.org/mousemine/portal.do?class=Gene&externalids=${this.contextFeature.id}`
          window.open(url, '_blank')
        }
      }, {
        icon: 'cloud_download',
        label: 'Genomic sequences',
        helpText: 'Download genomic sequences for this feature from currently displayed genomes.',
        disabled: false,
        handler: function () {
          let url = this.dataManager.getFastaUrl(this.contextFeature, 'genomic', this.context.vGenomes)
          window.open(url, '_blank')
        }.bind(this)
      }, {
        icon: 'cloud_download',
        label: 'Transcript sequences',
        helpText: 'Download transcript sequences for this feature from currently displayed genomes.',
        disabled: false,
        handler: function () {
          let url = this.dataManager.getFastaUrl(this.contextFeature, 'transcript', this.context.vGenomes)
          window.open(url, '_blank')
        }.bind(this)
      }, {
        icon: 'cloud_download',
        label: 'CDS sequences',
        helpText: 'Download coding sequences for this feature from currently displayed genomes.',
        disabled: false,
        handler: function () {
          let url = this.dataManager.getFastaUrl(this.contextFeature, 'cds', this.context.vGenomes)
          window.open(url, '_blank')
        }.bind(this)
      }, {
        icon: 'cloud_download',
        label: 'Exon sequences',
        helpText: 'Download exon sequences for this feature from currently displayed genomes.',
        disabled: false,
        handler: function () {
          let url = this.dataManager.getFastaUrl(this.contextFeature, 'exon', this.context.vGenomes)
          window.open(url, '_blank')
        }.bind(this)
      }]
    }
  },
  computed: {
    menuTitle: function () {
      return this.contextFeature ? this.contextFeature.label : ''
    }
  },
  watch: {
    contextFeature: function (f) {
      if (!f) return
      let isPc = f.sotype === 'protein_coding_gene'
      let cdsOption = this.featureMenu.filter(mi => mi.label === 'CDS sequences')[0]
      cdsOption.disabled = !isPc
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
  },
  mounted: function () {
  }
})
</script>

<style scoped>
</style>
