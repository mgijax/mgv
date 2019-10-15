<template>
  <div class="feature-details">
    <table>
      <tr>
        <th style="width: 8%;">Canonical ID</th>
        <th style="width: 8%;">Symbol</th>
        <th style="width:  7%;">Genome</th>
        <th style="width: 15%;">ID</th>
        <th style="width: 12%;">Type</th>
        <th style="width: 15%;">Coordinates</th>
        <th style="width: 7%;">Length</th>
      </tr>
      <tr
        v-for="(f,i) in features"
        :key="i"
        :class="{ current: isCurrent(f) }"
        >
        <td v-html="makeLink(f)"></td>
        <td>{{f && f.symbol || '.'}}</td>
        <td>{{f && f.genome.name || '.'}}</td>
        <td>{{f && f.ID || '.'}}</td>
        <td>{{f && f.sotype || '.'}}</td>
        <td>{{f && `${f.chr.name}:${f.start}..${f.end} (${f.strand})` || '.'}}</td>
        <td>{{f && f.length || '.'}}</td>
      </tr>
    </table>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
export default MComponent({
  name: 'FeatureDetails',
  props: {
    features: {
      default: function () { return [] }
    },
    currentMouseover: Object
  },
  methods: {
    isCurrent: function (f) {
      if (!f) return false
      let cmo = this.currentMouseover
      return cmo && cmo.ID === f.ID
    },
    makeLink: function (f) {
      if (!f || !f.cID) return '.'
      if (!f.cID.startsWith('MGI:')) return f.cID
      return `<a target="_blank" href="http://www.informatics.jax.org/accession/${f.cID}">${f.cID}</a>`

    }
  }
})
</script>

<style scoped>
table {
  width: 100%;
  font-size: 12px;
  table-layout: fixed;
  white-space: nowrap;
}
table * {
  text-align: left;
}
table tr.current {
  background-color: #eee;
}
</style>
