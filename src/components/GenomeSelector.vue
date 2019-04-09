<template>
  <div
    class="genomeSelector flexcolumn"
    >
    <select
      multiple
      size=10
      v-model="vGs"
      @change="changed"
      >
      <option
        v-for="genome in allGenomes"
        :key="genome.name"
        :value="genome.name"
        >{{genome.name}}</option>
    </select>
    <button
      v-for="(gs, i) in genomeSets"
      :key="i"
      :title="gs.description"
      @click="selectGenomeSet(gs)"
      >{{gs.label}}</button>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import u from '@/lib/utils'
export default MComponent({
  name: 'GenomeSelector',
  props: ['allGenomes', 'strips', 'genomeSets'],
  inject: ['regionManager'],
  data: function () {
    return {
      vGs: [] // list of visible genome names
    }
  },
  mounted: function () {
    this.reset()
    this.$root.$on('context-changed', () => this.reset())
  },
  methods: {
    reset: function () {
      this.vGs = this.strips.map(s => s.genome.name)
    },
    selectGenomeSet (gs) {
      this.vGs = gs.genomes.split(/,/g)
      this.changed()
    },
    changed: function () {
      this.regionManager().setStrips(this.vGs.map(g => this.dataManager.lookupGenome(g)))
    }
  },
  watch: {
    strips: function () {
      this.reset()
    }
  }
})
</script>

<style scoped>
.genomeSelector label {
  align-self: flex-start;
}
.genomeSelector .flexrow {
  justify-content: flex-start;
}
</style>
