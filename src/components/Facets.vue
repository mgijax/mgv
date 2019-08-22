<template>
  <div
     class="facets"
     :class="{ someoneActive: someoneActive }"
     >
     <page-box
       v-for="fd in facetData"
       :key="fd.name"
       :initiallyOpen="fd.initiallyOpen"
       :label="fd.name"
       :draggable="false"
       :message="fd.message"
       >
       <facet
         :name="fd.name"
         :values="fd.values"
         :initialSelection="fd.initialSelection"
         :colors="fd.colors"
         :multi="fd.multi"
         :mapper="fd.mapper"
         ref="facets"
         @facet-change="facetStateChanged"
         />
     </page-box>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import Facet from '@/components/Facet'
import PageBox from '@/components/PageBox'
export default MComponent({
  name: 'Facets',
  components: { Facet, PageBox },
  inject: ['featureColorMap'],
  data: function () {
    return {
      someoneActive: false,
      facetData: [{
        name: 'Feature type',
        values: this.featureColorMap.getTypes(),
        initialSelection: this.featureColorMap.getTypes(),
        colors: this.featureColorMap.getColors(),
        multi: true,
        initiallyOpen: true,
        mapper: function (f) {
          return this.featureColorMap.getMungedType(f.sotype)
        }.bind(this),
        message: ""
      }, {
        name: 'Feature length',
        values: ['< 1kb', '1-10kb', '10-100kb', '100kb - 1Mb', '> 1Mb'],
        initialSelection: ['< 1kb', '1-10kb', '10-100kb', '100kb - 1Mb', '> 1Mb'],
        multi: true,
        initiallyOpen: false,
        mapper: function (f) {
          let n = f.end - f.start + 1
          return n < 1000 ? '< 1kb' : n <= 10000 ? '1-10kb' : n <= 100000 ? '10-100kb' : n <= 1000000 ? '100kb - 1Mb' : '> 1Mb'
        },
        message: ""
      }, {
        name: 'Has canonical ID',
        values: [true, false, 'dont care'],
        initialSelection: 'dont care',
        multi: false,
        initiallyOpen: false,
        mapper: function (f) {
          if (this.selectedSet.has('dont care')) return 'dont care'
          return f.cID !== null
        },
        message: ""
      }, {
        name: 'Is in current list',
        values: [true, false, 'dont care'],
        initialSelection: 'dont care',
        multi: false,
        initiallyOpen: false,
        mapper: function (f) {
          if (this.selectedSet.has('dont care')) return 'dont care'
	  if (!this.app.currentList) return false
          return this.app.currentListSet.has(f.cID) || this.app.currentListSet.has(f.ID)
        },
        message: ""
      }, {
        name: 'Is currently selected',
        values: [true, false, 'dont care'],
        initialSelection: 'dont care',
        multi: false,
        initiallyOpen: false,
        mapper: function (f) {
          if (this.selectedSet.has('dont care')) return 'dont care'
	  const cs = this.app.currentSelection
	  if (!cs || cs.length === 0) return true
	  return cs.indexOf(f.cID) !== -1
        },
        message: ""
      }]
    }
  },
  methods: {
    test: function (f) {
      return this.$refs.facets.every(facet => facet.test(f))
    },
    getFacetState: function () {
      let active = this.$refs.facets.filter(f => f.active)
      return active.map(f => {
        const s = Array.isArray(f.selected) ? f.selected : [f.selected]
        return { facet: f.name, values: s }
      })
    },
    facetStateChanged (facet) {
      // find the data item for this facet.
      const fd = this.facetData.filter(fd => fd.name === facet.name)[0]
      fd.message = facet.active ? "Active." : ""
      let state = this.getFacetState()
      this.someoneActive = state.length > 0
      this.$root.$emit('facet-state', state)
    }
  }
})
</script>

<style scoped>
.someoneActive {
}
</style>
