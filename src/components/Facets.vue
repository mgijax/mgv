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
    // Each stanza defines a filter, givig its name, list of possible values, etc.
    // The user selects 0, 1, or many of the values, depending on whether multi is true or not.
    // The only tricky part is the mapper. This function is applied to each feature and returns a value.
    // If the value is among those selected by the user, the feature is included, otherwise excluded.
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
	  if (!this.app.currentList || this.app.currentList.length === 0) return Array.from(this.selectedSet)[0]
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
	  const cs = this.app.currentSelectionSet
	  if (!cs || cs.size === 0) return Array.from(this.selectedSet)[0]
	  return cs.has(f.cID) || cs.has(f.ID)
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
    },
    resetAll () {
      this.$refs.facets.forEach(f => f.inactivate())
    }
  },
  created: function () {
    this.$root.$on('selection-state-changed', () => {
      const icsi = this.facetData.map(fd => fd.name).indexOf('Is currently selected')
      const ics = this.$refs.facets[icsi]
      if (ics.active) {
        this.$root.$emit('facet-state', this.getFacetState())
      }
    })
  }
})
</script>

<style scoped>
.someoneActive {
}
</style>
