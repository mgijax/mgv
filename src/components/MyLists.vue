<template>
  <div class="my-lists">
     <!-- List of user's lists -->
     <div class="flexcolumn">
       <span>My lists <span style="font-size: smaller;">({{ lists.length }} list{{ lists.length === 1 ? '' : 's' }})</span></span>
       <div class="flexrow"
         v-if="lists.length > 0"
         style="justify-content: space-around;cursor:pointer;max-height:12px;">
         <i class="material-icons"
           :style="{opacity:currentSort.attr==='name'?1:0, flexGrow:1}"
           title="Click to sort"
           @click="setSort('name')"
           >arrow_drop_{{currentSort.dir === -1 ? 'down' : 'up'}}</i>
         <i class="material-icons"
           :style="{opacity:currentSort.attr==='created'?1:0, flexGrow:1}"
           title="Click to sort"
           @click="setSort('created')"
           >arrow_drop_{{currentSort.dir === -1 ? 'down' : 'up'}}</i>
       </div>
       <div class="flexcolumn listolists">
         <my-list-item
           v-for="item in sortedLists"
           :key="item.name"
           :item="item"
           :class="{ current: item === currentList }"
           />
       </div>
     </div>
     <p/>
     <!-- Create list controls -->
     <span>Create</span>
     <div class="flexrow">
       <select v-model="createMethod">
         <option
           v-for="opt in createOptions"
           :key="opt.label"
           :value="opt.value"
           >{{opt.label}}</option>
       </select>
       <button class="gobutton" @click="clickedGo">GO</button>
     </div>
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
        label: 'New list from ZoomView  selection',
        value: 'newFromSel'
      }, {
        label: 'New list from combining lists',
        value: 'newFromCombo'
      }, {
        label: 'New mouse ID list from search...',
        value: 'newFromQuery'
      }],
      createMethod: 'newFromQuery',
      currentSort: {
        attr: 'created',
        dir: -1
      }
    }
  },
  computed: {
    sortedLists () {
      this.sort(this.currentSort.attr, this.currentSort.dir)
      return this.lists
    }
  },
  methods: {
    clickedGo () {
      this[this.createMethod]()
      this.app.logEvent('ListOp', 'new')
    },
    newEmpty () {
      this.$root.$emit('list-edit-new')
    },
    newFromSel () {
      this.$root.$emit('list-edit-newfromselected')
    },
    newFromCombo () {
      this.$root.$emit('list-edit-new')
    },
    newFromQuery () {
      this.$refs.findGenes.doSearch()
    },
    setSort(attr) {
      if (attr === this.currentSort.attr) {
        this.currentSort.dir = 1 - this.currentSort.dir
      } else {
        this.currentSort.attr = attr
      }
    },
    sort (attr, dir) {
      this.app.lists.sort((a,b) => {
        const val =  a[attr] < b[attr] ? -1 : a[attr] > b[attr] ? 1 : 0
        return dir * val
      })
    }
  }
})
</script>

<style scoped>
.my-lists .listolists {
  max-height: 250px;
  overflow-y: scroll;
}
.gobutton {
  background-color: green;
  color: white;
  margin: 4px;
  border-width: 1px;
}
</style>
