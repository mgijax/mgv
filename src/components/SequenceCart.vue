<template>
  <div class="sequence-cart">
     <div class="flexrow">
       <m-button
         icon="check_box"
         title="Select all items in the cart."
         @click="selectAll"
         />
       <m-button
         icon="check_box_outline_blank"
         title="Un-select all items in the cart."
         @click="unselectAll"
         />

       <div style="flex-grow: 1;"></div>

       <m-button
         icon="input"
         title="Inject selected sequences into tool."
         @click="emitSelected"
         />

       <div style="flex-grow: 1;"></div>

       <m-button
         icon="delete"
         color="red"
         title="Remove selected items from the cart."
         @click="clearSelected"
         />
     </div>
     <div class="sequence-cart-items">
       <sequence-cart-item
         v-for="item in cart"
         :key="item.name"
         :item="item"
         ref="items"
         @delete-me="deleteItem"
         />
     </div>
     <span v-show="cart.length === 0">Cart is empty.</span>
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
      r.selected = r.selected || false
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
    },
    getSequencesForSelected: function () {
      const selected = this.cart.filter(item => item.selected)
      return this.dataManager.getSequences(selected)
    },
    emitSelected: function () {
      this.getSequencesForSelected().then(seqs => {
        this.$root.$emit('sequence-cart-sequences', seqs)
      })
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
.sequence-cart {
  border-radius: 4px;
  border: thin solid black;
  min-width: 350px;
}
.sequence-cart-items {
  max-height: 450px;
  overflow: scroll;
}
</style>
