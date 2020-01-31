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
          :class="{ selected : vGs.indexOf(genome.name) >= 0, reference: genome === rGenome }"
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
      rG: null, // the ref genome (if any). rG must be present in vGs
      shifted: false // needed for implementing shift-click behavior on radio buttons
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
    // Checkbox changed. 
    changed: function (e) {
      // If user has the shift key down, make this and the reference
      // genome the ONLY checked boxes.
      if (this.shifted) {
        e.target.checked = true
        this.vGs = [e.target.value]
        if (this.rG && this.rG !== e.target.value) {
          this.vGs.push(this.rG)
        }
        this.shifted = false
      }
      // If this is the reference genome, you cannot uncheck the box
      if (e && this.rG === e.target.value) {
        e.target.checked = true
        if (this.vGs.indexOf(this.rG) === -1) {
          this.vGs.push(this.rG)
        }
      }
      this.$root.$emit('region-change', { op : 'set-genomes', rGenome: this.rG, vGenomes: this.vGs })
    },
    // Checkbox clicked. This event is always received, and is followed immediately by a change event.
    // Here we need to record whenther shift key is down because we don't get that in the change event.
    clicked: function (e) {
      this.shifted = e.shiftKey
    },
    // Radio button changed. We only receive this event if the value actually changed. (If user clicks again,
    // no change event.)
    rgChanged: function (e) {
      const rgn = e.target.value
      this.app.rGenome = this.dataManager().lookupGenome(rgn)
      if (this.app.rGenome && this.vGs.indexOf(rgn) === -1) {
        this.vGs.push(rgn)
      }
      this.changed()
    },
    // Radio button clicked. This event is always received, whether the value changed or not.
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
.genome-selector tr.reference td.gname:before {
  color: rgb(255, 127, 14);
  content: "\2022";
}
.genome-selector tr:hover,
.genome-selector tr.selected:hover {
  background-color: #ccc;
}
.genome-selector .table-container {
  max-height: 300px;
  overflow-y: scroll;
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
