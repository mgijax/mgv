<template>
  <div
    class="sequence-cart-item flexrow"
    :class="{ selected: item.selected }"
    >
    <!-- Selected checkbox -->
    <m-button
      :icon="item.selected ? 'check_box' : 'check_box_outline_blank'"
      @click.stop="item.selected = !item.selected"
      />
    <!-- Sequence header -->
    <div class="flexcolumn seqheader" style="align-items: flex-start;">
      <div
        v-for="(v,i) in headerLines"
        :key="i"
        >{{v.replace('::', ' ')}}</div>
    </div>
    <div>{{prettyPrint(item.length)}}</div>
    <!-- Reverse-complement button (for genomic sequence only) -->
    <m-button
      v-if="item.type==='dna' && item.start"
      :icon="item.reverseComplement ? 'AG' : 'CT'"
      :style="{ transform: `rotate(${item.reverseComplement ? 180 : 0}deg)` }"
      :title="`Reverse complement is ${item.reverseComplement ? 'ON' : 'OFF'}. Click to turn ${item.reverseComplement ? 'OFF' : 'ON'}.`"
      @click.stop="item.reverseComplement = !item.reverseComplement"
      />
    <!-- Translate button (for CDS sequence only) -->
    <m-button
      v-if="item.type==='cds'"
      :icon="item.translate ? 'M' : 'ATG'"
      :title="`Protein translation is ${item.translate ? 'ON' : 'OFF'}. Click to turn ${item.translate ? 'OFF' : 'ON'}.`"
      @click.stop="item.translate = !item.translate"
      />
    <!-- Delete button -->
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
import u from '@/lib/utils'
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
    },
    prettyPrint (len) {
      if (this.item.translate) {
        return Math.floor(len / 3) + ' aa'
      } else {
        return u.prettyPrintBases(len)
      }
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
  },
  mounted: function () {
    this.$watch('item', function () {this.$emit('item-changed')}, {deep:true})
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
.sequence-cart-item[disabled] {
  opacity: 0.5;
}
.sequence-cart-item.selected {
  background-color: #ccc;
}
.seqheader {
  font-size: 10px;
}
</style>
