<template>
  <div class="sequence-cart">
     <sequence-cart-item
         v-for="item in cart"
         :key="item.name"
         :item="item"
         ref="items"
         @delete-me="deleteItem"
         />
     <div class="flexrow">
       <m-button
         v-show="cart.length > 0"
         icon="check_box"
         title="Select all items in the cart."
         @click="selectAll"
         />
       <m-button
         v-show="cart.length > 0"
         icon="check_box_outline_blank"
         title="Un-select all items in the cart."
         @click="unselectAll"
         />
       <div style="flex-grow: 1;"></div>
       <m-button
         v-show="cart.length > 0"
         icon="delete"
         color="red"
         title="Remove currently selected items from the cart."
         @click="clearSelected"
         />
     </div>
     <span v-show="cart.length === 0">No sequences</span>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import SequenceCartItem from '@/components/SequenceCartItem'
export default MComponent({
  name: 'SequenceCart',
  data: function () {
    return {
      cart: []
    }
  },
  components: { SequenceCartItem, MButton },
  methods: {
    add (r) {
      r.selected = false
      this.cart.push(r)
    },
    clear () {
      this.cart = []
    },
    clearSelected () {
      this.cart = this.cart.filter(item => !item.selected)
    },
    deleteItem: function (item) {
      const i = this.cart.indexOf(item)
      if (i >= 0) {
        this.cart.splice(i, 1)
      }
    },
    selectAll: function () {
      this.cart.forEach(item => {item.selected = true})
    },
    unselectAll: function () {
      this.cart.forEach(item => {item.selected = false})
    }
  },
  mounted: function () {
    this.$root.$on('region-selected', r => this.add(r))
    this.$root.$on('sequence-selected', rs => {
      rs.forEach(r => this.add(r))
    })
  }
})
</script>

<style scoped>
</style>
