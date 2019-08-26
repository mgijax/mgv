<template>
  <div
    class="genome-selector flexcolumn"
    >
      <div class="table-container">
      <table cellspacing="0px" >
        <tr
          v-for="genome in allGenomes"
          :key="genome.name"
          >
          <td
            >{{genome.name}}</td>
          <td>
            <input
              type="checkbox"
              :value="genome.name"
              v-model="vGs"
              @change="changed"
              @click="clicked"
              />
          </td>
        </tr>  
      </table>
      </div>
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
  inject: ['regionManager','dataManager'],
  data: function () {
    return {
      vGs: [], // list of visible genome names
      rg: null, // the reference genome
      shifted: false
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
    changed: function (e) {
      if (this.shifted) {
        e.target.checked = true
        this.vGs = [e.target.value]
      }
      this.regionManager().setStrips(this.vGs.map(g => this.dataManager().lookupGenome(g)))
      this.shifted = false
    },
    clicked: function (e) {
      this.shifted = e.shiftKey
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
.genome-selector tr:hover {
  background-color: #ccc;
}
.genome-selector .table-container {
  max-height: 300px;
  overflow: scroll;
}
.genome-selector .table-container table {
  width: 100%
}
.genome-selector td {
  text-align: left;
}
.genome-selector input[type="radio"] {
  opacity: 0;
}
.genome-selector input[type="radio"]:checked {
  opacity: 1;
}
.genome-selector tr:hover input[type="radio"] {
  opacity: 1;
}
</style>
