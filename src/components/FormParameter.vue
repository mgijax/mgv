<template>
    <tr class="formParameter">
      <td>
        <a
        target="_blank"
        :href="`https://www.ebi.ac.uk/seqdb/confluence/display/THD/${tdesc.label}#${tdesc.label.replace('+','')}-${pdesc.name}`"
        ><label>{{pdesc.label}}</label></a>
      </td>

      <td>
      <input v-if="pdesc.type === 'text'" :name="pdesc.name" type="text" :value="pdesc.value"/>
      <input v-if="pdesc.type === 'checkbox'" :name="pdesc.name" type="checkbox" />
      <input v-if="pdesc.type === 'file'" :name="pdesc.name" type="file" />

      <div v-if="pdesc.type === 'sequence'" >
        <textarea v-model="sequence" :name="pdesc.name" rows="10" cols="65"></textarea>
        <div class="flexrow">
          <span>{{sequence.length}} characters</span>
          <button @click.stop.prevent="$emit('clear','sequence')">Clear</button>
        </div>
      </div>
      <div v-if="pdesc.type === 'asequence'" >
        <textarea v-model="asequence" :name="pdesc.name" rows="10" cols="65"></textarea>
        <div class="flexrow">
          <span>{{asequence.length}} characters</span>
          <button @click.stop.prevent="$emit('clear','asequence')">Clear</button>
        </div>
      </div>
      <div v-if="pdesc.type === 'bsequence'" >
        <textarea v-model="bsequence" :name="pdesc.name" rows="10" cols="65"></textarea>
        <div class="flexrow">
          <span>{{bsequence.length}} characters</span>
          <button @click.stop.prevent="$emit('clear','bsequence')">Clear</button>
        </div>
      </div>
      </div>

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
import MComponent from './MComponent.js'
export default MComponent({
  name: 'FormParameter',
  props: ['tool', 'parameter', 'labelXtra', 'sequence', 'asequence', 'bsequence'],
  computed: {
    pdesc: function () {
      return this.parameter
    },
    tdesc: function () {
      return this.tool
    },
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

.formParameter input[type="text"] {
  width: 250px; 
}
</style>
