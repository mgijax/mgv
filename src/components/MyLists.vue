<template>
  <div class="my-lists">
     <div class="flexcolumn">
     <my-list-item
         v-for="item in lists"
         :key="item.name"
         :item="item"
         :class="{ current: item === currentList }"
         />
     <span v-if="lists.length == 0">No lists</span>
     </div>
     <button
       @click="newlist"
       title="Create a new list by entering/pasting identifiers."
       >New</button>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MyListItem from '@/components/MyListItem'
export default MComponent({
  name: 'MyLists',
  props: ['lists', 'currentList'],
  components: { MyListItem },
  methods: {
    newlist: function () {
      this.$root.$emit('list-edit-new')
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
