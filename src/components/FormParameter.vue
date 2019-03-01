<template>
    <tr class="formParameter">
      <td>
        <a
        target="_blank"
        :href="`https://www.ebi.ac.uk/seqdb/confluence/display/THD/${tdesc.label}#${tdesc.label.replace('+','')}-${pdesc.name}`"
        ><label>{{pdesc.label}} {{length}}</label></a>
      </td>

      <td>
      <input v-if="pdesc.type === 'text'" :name="pdesc.name" type="text" :value="pdesc.value"/>
      <input v-if="pdesc.type === 'checkbox'" :name="pdesc.name" type="checkbox" />
      <input v-if="pdesc.type === 'file'" :name="pdesc.name" type="file" />

      <textarea v-if="pdesc.type === 'sequence'" v-model="sequence" :name="pdesc.name" rows="10" cols="65"></textarea>
      <textarea v-if="pdesc.type === 'asequence'" v-model="asequence" :name="pdesc.name" rows="10" cols="65"></textarea>
      <textarea v-if="pdesc.type === 'bsequence'" v-model="bsequence" :name="pdesc.name" rows="10" cols="65"></textarea>

      <select v-if="pdesc.type === 'select'" :name="pdesc.name">
        <option
          v-for="(o,j) in pdesc.options"
          :value="o.value || o.label || o"
          :selected="o.selected"
          >{{o.label || o.value || o}}</option>
      </select>
      </td>
    </tr>
</template>

<script>
import MComponent from '@/components/MComponent'
export default MComponent({
  name: 'FormParameter',
  props: ['tool', 'parameter'],
  computed: {
    pdesc: function () {
      return this.parameter
    },
    tdesc: function () {
      return this.tool
    },
    length: function () {
      const p = this.parameter
      if (p.type.includes('sequence') && this[p.type].length > 0) {
        return u.prettyPrintBases(this[p.type].length)
      }
      return ''
    }
  }
})
</script>

<style scoped>
.formParameter a label {
  cursor: pointer;
}
.formParameter:hover {
  background-color: #ccc;
}

</style>
