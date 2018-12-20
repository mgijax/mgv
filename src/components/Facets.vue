<template>
  <div
     class="facets"
     :class="{ someoneActive: someoneActive }"
     >
     <facet
       v-for="fd in facetData"
       :key="fd.name"
       :name="fd.name"
       :values="fd.values"
       :initialSelection="fd.initialSelection"
       :colors="fd.colors"
       :multi="fd.multi"
       :disabled="fd.disabled"
       :mapper="fd.mapper"
       ref="facets"
       @facet-change="facetStateChanged"
       />
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import Facet from '@/components/Facet'
export default MComponent({
  name: 'Facets',
  components: { Facet },
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
        disabled: true,
        mapper: function (f) {
          return this.featureColorMap.getMungedType(f.sotype)
        }.bind(this)
      }, {
        name: 'Feature length',
        values: ['< 1kb', '1-10kb', '10-100kb', '100kb - 1Mb', '> 1Mb'],
        initialSelection: ['< 1kb', '1-10kb', '10-100kb', '100kb - 1Mb', '> 1Mb'],
        multi: true,
        disabled: true,
        mapper: function (f) {
          let n = f.end - f.start + 1
          return n < 1000 ? '< 1kb' : n <= 10000 ? '1-10kb' : n <= 100000 ? '10-100kb' : n <= 1000000 ? '100kb - 1Mb' : '> 1Mb'
        }
      }, {
        name: 'Has canonical ID',
        values: [true, false],
        initialSelection: true,
        multi: false,
        disabled: true,
        mapper: function (f) {
          return f.cID !== null
        }
      }]
    }
  },
  methods: {
    test: function (f) {
      return this.$refs.facets.every(facet => facet.test(f))
    },
    getFacetState: function () {
      let active = this.$refs.facets.filter(f => f.enabled)
      return active.map(f => {
        return { facet: f.name, values: f.selected }
      })
    },
    facetStateChanged (facet) {
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
