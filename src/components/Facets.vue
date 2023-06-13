<template>
  <div
     class="facets"
     :class="{ someoneActive: someoneActive }"
     >
     <page-box
       v-for="(fd,i) in facetData"
       :key="fd.name"
       :initiallyOpen="fd.initiallyOpen"
       :label="fd.name"
       :title="fd.description"
       :draggable="false"
       :message="fd.message"
       :messageClickHandler="() => facetOff(i)"
       messageIcon="filter_alt"
       >
       <facet
         :name="fd.name"
         :type="fd.type"
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
import MComponent from './MComponent.js'
import Facet from './Facet.vue'
import PageBox from './PageBox.vue'
export default MComponent({
  name: 'Facets',
  components: { Facet, PageBox },
  inject: ['featureColorMap','dataManager'],
  data: function () {
    // Each stanza defines a filter, givig its name, list of possible values, etc.
    // The user selects 0, 1, or many of the values, depending on whether multi is true or not.
    // The only tricky part is the mapper. This function is applied to each feature and returns a value.
    // If the value is among those selected by the user, the feature is included, otherwise excluded.
    return {
      someoneActive: false,
      facetData: [{
        type: 'feature',
        name: 'Feature type',
        description: 'Limit the display to show only features of the selected types.',
        values: this.featureColorMap.getTypes(),
        initialSelection: this.featureColorMap.getTypes(),
        colors: this.featureColorMap.getColors(),
        multi: true,
        initiallyOpen: true,
        mapper: function (f) {
          return this.featureColorMap.getMungedType(f.type)
        }.bind(this),
        message: ""
      }, {
        type: 'feature',
        name: 'Feature length',
        description: 'Limit the display to show only features with total genomic length in the selected ranges.',
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
        name: 'Missing in some* genome',
        type: 'feature',
        description: `
        If false, only shows features that are missing in some *displayed* genome.
        If true, only shows features that occur in all displayed genomes.
        Features missing from a genome may indicate a structural difference, but may also indicate assembly/annotation issues.`,
        values: [true, false, 'dont care'],
        initialSelection: 'dont care',
        multi: false,
        initiallyOpen: false,
        mapper: function (f) {
          if (this.selectedSet.has('dont care')) return 'dont care'
          const homologs = this.app.dataManager.getHomologs(f, this.app.vGenomes)
          const genomes = new Set(homologs.map(f => f.genome))
          return genomes.size !== this.app.vGenomes.length
        },
        message: ""
      }, {
        name: 'Feature in current list',
        type: 'feature',
        description: 'If true limits display to features in the currently selected list. If false, limits to features not in the list. Click a list in "Lists and Searches" to make it current.',
        values: [true, false, 'dont care'],
        initialSelection: 'dont care',
        multi: false,
        initiallyOpen: false,
        mapper: function (f) {
          if (this.selectedSet.has('dont care')) return 'dont care'
          if (!this.app.currentList || this.app.currentList.length === 0) return Array.from(this.selectedSet)[0]
          return this.app.currentListSet.has(f.curie) || this.app.currentListSet.has(f.ID)
        },
        message: ""
      }, {
        name: 'Feature is selected',
        type: 'feature',
        description: 'If true and some features are currently selected, limits display to those features. Good for looking at one feature at a time. If false, removes those features from display.',
        values: [true, false, 'dont care'],
        initialSelection: 'dont care',
        multi: false,
        initiallyOpen: false,
        mapper: function (f) {
          if (this.selectedSet.has('dont care')) return 'dont care'
          if (this.app.currentSelection.length === 0) return true
          for (let i = 0; i < this.app.currentSelection.length; i++) {
            if (this.app.dataManager.equivalent(f, this.app.currentSelection[i])) return true
          }
          return false
        },
        message: ""
      /*
      }, {
        name: 'Variant type',
        type: 'variant',
        description: '',
        values: ['point_mutation','insertion','deletion','delins','MNV'],
        initialSelection: ['point_mutation','insertion','deletion','delins','MNV'],
        multi: true,
        initiallyOpen: false,
        mapper: function (v) {
          return v.so_term
        },
        message: ""
      }, {
        name: 'Variant impact',
        type: 'variant',
        description: '',
        values: ['HIGH','MODERATE','LOW','MODIFIER'],
        initialSelection: ['HIGH','MODERATE','LOW','MODIFIER'],
        multi: true,
        initiallyOpen: false,
        mapper: function (v) {
          return v.gEffects.map(g => g.impact)
        },
        message: ""
      }, {
        name: 'Variant consequence',
        type: 'variant',
        description: '',
        values: [
        '3_prime_UTR_variant',
        '5_prime_UTR_variant',
        'coding_sequence_variant',
        'frameshift_variant',
        'inframe_deletion',
        'inframe_insertion',
        'intergenic_variant',
        'intron_variant',
        'missense_variant',
        'non_coding_transcript_exon_variant',
        'non_coding_transcript_variant',
        'protein_altering_variant',
        'splice_acceptor_variant',
        'splice_donor_variant',
        'splice_region_variant',
        'start_lost',
        'start_retained_variant',
        'stop_gained',
        'stop_lost',
        'stop_retained_variant',
        'synonymous_variant',
        'transcript_ablation',
        ],
        initialSelection: [
        '3_prime_UTR_variant',
        '5_prime_UTR_variant',
        'coding_sequence_variant',
        'frameshift_variant',
        'inframe_deletion',
        'inframe_insertion',
        'intergenic_variant',
        'intron_variant',
        'missense_variant',
        'non_coding_transcript_exon_variant',
        'non_coding_transcript_variant',
        'protein_altering_variant',
        'splice_acceptor_variant',
        'splice_donor_variant',
        'splice_region_variant',
        'start_lost',
        'start_retained_variant',
        'stop_gained',
        'stop_lost',
        'stop_retained_variant',
        'synonymous_variant',
        'transcript_ablation',
        ],
        multi: true,
        initiallyOpen: false,
        mapper: function (v) {
          return u.flatten(v.gEffects.map(g => g.consequence))
        },
        message: ""
        */
      }]
    }
  },
  methods: {
    facetOff: function (i) {
      this.$refs.facets[i].inactivate()
    },
    test: function (f, type) {
      return this.$refs.facets.every(facet => facet.type !== type || facet.test(f))
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
      fd.message = facet.active ? "Active. Click to turn off." : ""
      let state = this.getFacetState()
      this.someoneActive = state.length > 0
      this.$root.$emit('facet-state', state)
    },
    resetAll () {
      this.$refs.facets.forEach(f => f.inactivate())
    }
  },
  created: function () {
    this.$root.$on('clear-facets', () => {
        this.resetAll()
    })
    this.$root.$on('selection-state-changed', () => {
      const icsi = this.facetData.map(fd => fd.name).indexOf('Feature is selected')
      const ics = this.$refs.facets[icsi]
      if (ics.active) {
        this.$root.$emit('facet-state', this.getFacetState())
      }
    })
  }
})
</script>

<style scoped>
.facets .pagebox .label-wrapper {
    top: 24px;
}
</style>
