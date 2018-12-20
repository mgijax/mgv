<template>
  <div class="genomeSelector flexcolumn">
  <label>Reference</label>
  <select
    v-model="rG"
    @change="changeRef"
    >
    <option
      v-for="genome in allGenomes"
      :key="genome.name"
      :value="genome.name"
      >{{genome.name}}</option>
  </select>
  <label>Comparison</label>
  <select
    multiple
    size=10
    v-model="vGs"
    @change="changeComps"
    >
    <option
      v-for="genome in allGenomes"
      :key="genome.name"
      :value="genome.name"
      >{{genome.name}}</option>
  </select>
  <button
   v-for="(gs,i) in genomeSets"
   :key="i"
   type="button"
   @click="selectedGenomeSet(gs)"
   >{{gs.label}}</button>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import u from '@/lib/utils'
export default MComponent({
  name: 'GenomeSelector',
  props: ['allGenomes', 'vGenomes', 'rGenome', 'genomeSets'],
  data: function () {
    return {
      vGs: this.vGenomes.map(g => g.name),
      rG: this.rGenome.name
    }
  },
  mounted: function () {
    this.$watch('$props', () => {
      this.reset()
    }, { 'deep': true })
  },
  methods: {
    changeRef: function () {
      let newRefAlreadyVisible = this.vGenomes.filter(vg => vg.name === this.rG).length !== 0
      if (newRefAlreadyVisible) {
        this.$root.$emit('context', { ref: this.rG })
      } else {
        let vgs = this.vGenomes.filter(vg => vg !== this.rGenome)
        this.$root.$emit('context', { ref: this.rG, genomes: vgs })
      }
    },
    changeComps: function () {
      // here we want to preserve current vGenomes order as much as possible.
      // index the selected list
      let vgxmy = u.index(this.vGs)
      // list containing selected genomes, in current vGenomes order
      let lst = this.vGenomes.filter(vg => vg.name in vgxmy).map(vg => vg.name)
      // selected lists not in current vGenomes are to the end
      let vgx = u.index(this.vGenomes, 'name')
      let xtra = this.vGs.reduce((lst, vg) => { if (!(vg in vgx)) lst.push(vg); return lst }, [])
      //
      this.$root.$emit('context', { genomes: lst.concat(xtra) })
    },
    reset () {
      this.rG = this.rGenome.name
      this.vGs = this.vGenomes.map(g => g.name)
    },
    selectedGenomeSet: function (gs) {
      this.$root.$emit('context', {
        ref: gs.ref,
        genomes: gs.genomes.split(',')
      })
    }
  }
})
</script>

<style scoped>
.genomeSelector label {
    align-self: flex-start;
}
</style>
