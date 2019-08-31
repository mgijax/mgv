<template>
  <div
    class="genome-selector flexcolumn"
    >
      <div class="table-container">
      <table cellspacing="0px" >
        <tr
          v-for="genome in allGenomes"
          :key="genome.name"
          :title="genomeTitleText(genome)"
          :class="{ selected : vGs.indexOf(genome.name) >= 0 }"
          >
          <td
            class="gname"
            >{{genome.name}}</td>
          <td>
            <input
              type="checkbox"
              :value="genome.name"
              v-model="vGs"
              @change="changed"
              @click="clicked"
              title="Check box to view this genome. Uncheck to hide. Shift-click to view this genome and hide all others."
              />
          </td>
          <td>
            <input
              name="refGenome"
              type="radio"
              :value="genome.name"
              v-model="rG"
              @click="rgClicked"
              @change="rgChanged"
              title="Click to make this the reference genome. Shift-click to turn off reference genome."
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
  props: ['allGenomes', 'strips', 'genomeSets', 'rGenome'],
  inject: ['regionManager','dataManager'],
  data: function () {
    return {
      vGs: [], // list of visible genome names
      rG: null, // the ref genome
      shifted: false
    }
  },
  mounted: function () {
    this.reset()
    this.$root.$on('context-changed', () => this.reset())
  },
  methods: {
    genomeTitleText: function (g) {
      const entries = Object.entries(g.metadata)
      entries.sort((a,b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
      return entries.map(e => `${e[0]}: ${e[1]}`).join('\n')
    },
    reset: function () {
      this.rG = this.rGenome ? this.rGenome.name : null
      this.vGs = this.strips ? this.strips.map(s => s.genome.name) : []
    },
    selectGenomeSet (gs) {
      this.vGs = gs.genomes.split(/,/g)
      this.rG = null
      this.app.rGenome = null
      this.changed()
    },
    changed: function (e) {
      if (this.shifted) {
        e.target.checked = true
        this.vGs = [e.target.value]
        if (this.rG && this.rG !== e.target.value) {
          this.vGs.push(this.rG)
        }
      }
      if (e && this.rG === e.target.value) {
        e.target.checked = true
        if (this.vGs.indexOf(this.rG) === -1) {
          this.vGs.push(this.rG)
        }
      }
      this.regionManager().setStrips(this.vGs.map(g => this.dataManager().lookupGenome(g)))
      this.app.rGenome = this.dataManager().lookupGenome(this.rG)
      this.shifted = false
    },
    clicked: function (e) {
      this.shifted = e.shiftKey
    },
    rgChanged: function (e) {
      const rgn = e.target.value
      this.app.rGenome = this.dataManager().lookupGenome(rgn)
      if (this.app.rGenome && this.vGs.indexOf(rgn) === -1) {
        this.vGs.push(rgn)
        this.changed()
      }
      this.$nextTick(() => this.$root.$emit('sort-strips', 'rgChanged'))
    },
    rgClicked: function (e) {
      if (e.shiftKey) {
        e.target.checked = false
        this.rG = null
        this.app.rGenome = null
      }
    }
  },
  watch: {
    strips: function () {
      this.reset()
    },
    rGenome: function () {
      this.reset()
    }
  }
})
</script>

<style scoped>
.genome-selector tr.selected td.gname {
  color: #1c80c6;
  font-weight: bold;
}
.genome-selector tr:hover,
.genome-selector tr.selected:hover {
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
.genome-selector:hover input[type="radio"] {
  opacity: 1;
}
</style>
