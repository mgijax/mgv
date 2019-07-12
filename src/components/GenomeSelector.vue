<template>
  <div
    class="genome-selector"
    >
    <div
      class="genome-selector-button flexrow"
      @click="dropVisible = true"
      >
      <span>Genomes</span>
      <i class="material-icons">arrow_drop_down</i>
    </div>
    <div
      class="genome-selector-drop flexcolumn"
      v-show="dropVisible"
      >
      <i
        class="material-icons drop-close"
        @click="dropVisible = false"
        >close</i>
      <label style="font-weight: bold; align-self: center;">Genomes</label>
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
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import u from '@/lib/utils'
export default MComponent({
  name: 'GenomeSelector',
  props: ['allGenomes', 'strips', 'genomeSets'],
  inject: ['regionManager','dataManager'],
  data: function () {
    return {
      dropVisible: false,
      vGs: [] // list of visible genome names
    }
  },
  mounted: function () {
    this.reset()
    this.$root.$on('context-changed', () => this.reset())
  },
  methods: {
    reset: function () {
      this.vGs = this.strips ? this.strips.map(s => s.genome.name) : []
    },
    selectGenomeSet (gs) {
      this.vGs = gs.genomes.split(/,/g)
      this.changed()
    },
    changed: function () {
      this.regionManager().setStrips(this.vGs.map(g => this.dataManager().lookupGenome(g)))
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
.genome-selector-button {
  cursor: pointer;
}
.genome-selector-drop {
  position: absolute;
  top: 15px;
  left: 15px;
  flex-grow: 0;
  width: 140px;
  background-color: #e0e0e0;
  padding: 4px;
  z-index: 100;
  border: thin solid gray;
  border-radius: 3px;
}
.genome-selector-drop label {
  align-self: flex-start;
}
.genome-selector-drop .flexrow {
  justify-content: flex-start;
}
.drop-close {
  position: absolute;
  top: 0px;
  right: 0px;
  font-size: 16px;
  cursor: pointer;
}
</style>
