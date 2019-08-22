<template>
 <table class="facet">
   <tr
     v-for="(v, i) in values"
     :key="v"
     >
     <!-- column 1 - spacer -->
     <td>
     </td>
     <!-- column 2 - checkboxes -->
     <td class="checkbox"
       :title="itemHelp(i)" >
       <div
         :style="{
           width: '18px',
           height: '18px',
           backgroundColor: colors && colors[i] ? colors[i] : 'gray',
           position: 'relative',
           borderRadius: '3px'
           }"
           >
         <input
           ref="inputs"
           v-model="selected"
           :name="name"
           :value="v"
           :type="multi ? 'checkbox' : 'radio'"
           style="opacity: 0"
           />
         <i class="material-icons"
           :style="{
             color: 'white',
             position: 'absolute',
             top: '-4px',
             left: '0px',
             opacity: selectedSet.has(v) ? 1 : 0,
             cursor: 'pointer'
           }"
           @click="$event.shiftKey ? checkOnly(v) : $refs.inputs[i].click()"
           >done</i>
       </div>
     </td>
     <!-- column 3 - labels -->
     <td>{{v}}</td>
   </tr>
   <tr
     v-if="multi"
     >
     <td></td>
     <td colspan=2>
       <button @click="check('all')" type="button" value="Check all">Check all</button>
       <button @click="check('none')" type="button">Uncheck all</button>
     </td>
   </tr>
 </table>
</template>

<script>
import MComponent from '@/components/MComponent'
export default MComponent({
  name: 'Facet',
  props: {
    name: String, // facet name
    values: Array, // list of string values
    colors: Array, // list of string color values
    initialSelection: [Array, Boolean, String, Number], // initially selected values
    multi: Boolean, // multi (true) or single (false) selection
    mapper: Function // Maps an input object to a facet value
  },
  data: function () {
    return {
      selected: this.initialSelection ? this.initialSelection : this.multi ? [] : null // current selection
    }
  },
  computed: {
    selectedSet: function () {
      return new Set(this.multi ? this.selected : [this.selected])
    },
    active: function () {
      let s = this.selectedSet
      return s.size < this.values.length && !(s.size === 1 && s.has('dont care'))
    }
  },
  watch: {
    selected: function (e) {
      this.$emit('facet-change', this)
    }
  },
  methods: {
    // Returns true iff the given object is in a currently selected facet.
    test: function (f) {
      let ffacet = this.mapper(f)
      return this.selectedSet.has(ffacet)
    },
    check: function (allOrNone) {
      if (allOrNone === 'all') {
        this.selected = this.values
      } else {
        this.selected = []
      }
    },
    checkOnly: function (value) {
      this.selected = this.multi ? [value] : value
    },
    itemHelp: function (i) {
      if (!this.multi) return ""
      const v = this.values[i]
      return `Click to check/uncheck ${v}. Shift-click to check only ${this.values[i]}.`
    },
    inactivate: function () {
      if (this.multi) {
        this.selected = this.values
      } else {
        this.selected = 'dont care'
      }
    }
  }
})
</script>

<style scoped>
.facet {
  text-align: left;
}
.checkbox {
  -webkit-user-select: none; /* Safari */        
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE10+/Edge */
  user-select: none; /* Standard */
}
</style>
