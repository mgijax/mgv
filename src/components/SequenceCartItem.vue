<template>
  <div
    class="sequence-cart-item flexrow"
    :class="{ selected: item.selected }"
    @click.stop="toggleSelect"
    >
    <m-button
      :icon="item.selected ? 'check_box' : 'check_box_outline_blank'"
      />
    <div class="flexcolumn" style="align-items: flex-start;">
      <span
        v-for="(v,i) in headerLines"
        :key="i"
        >{{v}}</span>
    </div>
    <m-button
      title="Remove from cart."
      icon="highlight_off"
      color="red"
      hoverBackgroundColor="red"
      @click.stop="deleteClicked"
      />
  </div>
</template>

<script>
// A SequenceCartItem has one of two forms, depending on whether the sequence is for a database object
// with an ID (like a CDS), or an arbitrary genomic region (eg, specified with a drag).
// In the first case:
//   { genome, type, ID, header }
//   { genome, chr, start, end, header }
// Header is an optional string to display with the item
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
export default MComponent({
  name: 'SequenceCartItem',
  props: ['item'],
  components: { MButton },
  methods: {
    deleteClicked: function () {
      this.$emit('delete-me', this.item)
    },
    select: function () {
      this.item.selected = true
    },
    unselect: function () {
      this.item.selected = false
    },
    toggleSelect: function () {
      this.item.selected = !this.item.selected
    }
  },
  computed: {
    headerLines: function () {
      const i = this.item
      if (i.header) {
        return i.header.split('\n')
      } else {
        return [
          `${i.genome.name} (${i.type || 'dna'})`,
          `${i.ID || ''}` || `${i.chr.name}:${i.start}..${i.end}`
        ]
      }
    }
  }
})
</script>

<style scoped>
.sequence-cart-item {
  font-size: 12px;
  background-color: #eee;
  border-radius: 4px;
  margin: 2px;
  border: thin solid transparent;
  min-height: 40px;
}
.sequence-cart-item.selected {
  background-color: #ccc;
}
</style>