<template>
  <div class="my-lists">
     <div class="flexcolumn">
     <span>My lists: {{ lists.length }} list{{ lists.length === 1 ? '' : 's' }}</span>
     <my-list-item
         v-for="item in lists"
         :key="item.name"
         :item="item"
         :class="{ current: item === currentList }"
         />
     </div>
     <p/>
     <span>Create</span>
     <select v-model="createMethod">
       <option
         v-for="opt in createOptions"
         :value="opt.value"
         >{{opt.label}}</option>
     </select>
     <button @click="clickedGo">GO</button>
     <find-genes
       style="width: 95%; float: right;"
       ref="findGenes"
       v-show="createMethod === 'newFromQuery'"
       />

  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MyListItem from '@/components/MyListItem'
import FindGenes from '@/components/FindGenes'
export default MComponent({
  name: 'MyLists',
  props: ['lists', 'currentList'],
  components: { MyListItem, FindGenes },
  data: function () {
    return {
      createOptions: [{
        label: 'New empty list',
        value: 'newEmpty'
      }, {
        label: 'New list from current selection',
        value: 'newFromSel'
      }, {
        label: 'New list from combining lists',
        value: 'newFromCombo'
      }, {
        label: 'New list from query...',
        value: 'newFromQuery'
      }],
      createMethod: 'newEmpty'
    }
  },
  methods: {
    clickedGo () {
      this[this.createMethod]()
    },
    newEmpty () {
      this.$root.$emit('list-edit-new')
    },
    newFromSel () {
      this.$root.$emit('list-edit-newfromselected')
    },
    newFromCombo () {
    },
    newFromQuery () {
      this.$refs.findGenes.doSearch()
    }
  }
})
</script>

<style scoped>
.my-lists > div {
  max-height: 250px;
  overflow: scroll;
}
</style>
