<template>
  <div
    class="sequence-cart-item flexrow"
    :class="{ selected: item.selected }"
    >
    <!-- Selected checkbox -->
    <m-button
      :icon="item.selected ? 'check_box' : 'check_box_outline_blank'"
      @click.stop="toggleSelect"
      />
    <!-- Sequence header -->
    <div class="flexcolumn seqheader" style="align-items: flex-start;">
      <div
        style="text-align:left;"
        v-for="(v,i) in headerLines"
        :key="i"
        >{{v.replace('::', ' ')}}</div>
    </div>
    <div>{{prettyPrint(item.totalLength)}}</div>
    <!-- Reverse-complement button (for genomic sequence only) -->
    <m-button
      v-if="item.type==='dna' && !item.ID"
      :icon="item.reverse ? 'AG' : 'CT'"
      :style="{ transform: `rotate(${item.reverse ? 180 : 0}deg)` }"
      :title="`Reverse complement is ${item.reverse ? 'ON' : 'OFF'}. Click to turn ${item.reverse ? 'OFF' : 'ON'}.`"
      @click.stop="toggleReverseComplement"
      />
    <!-- Translate button (for CDS sequence only) -->
    <m-button
      v-if="item.type==='cds'"
      :icon="item.translate ? 'M' : 'ATG'"
      :title="`Protein translation is ${item.translate ? 'ON' : 'OFF'}. Click to turn ${item.translate ? 'OFF' : 'ON'}.`"
      @click.stop="toggleTranslate"
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
import MComponent from './MComponent.js'
import MButton    from './MButton.vue'
import u          from '../lib/utils.js'
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
    toggleTranslate: function () {
      const i = this.item
      i.translate = !i.translate
      const h1 = '(cds)'
      const h2 = '(translated cds)'
      i.header = i.translate ? i.header.replace(h1,h2) : i.header.replace(h2,h1)
    },
    toggleReverseComplement: function () {
      const i = this.item
      i.reverse = !i.reverse
      const h1 = '(dna)'
      const h2 = '(reverse complement dna)'
      i.header = i.reverse ? i.header.replace(h1,h2) : i.header.replace(h2,h1)
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
      const trim = (s,n) => s.length > n ? s.substring(0,n) + "..." : s 
      const i = this.item
      if (i.header) {
        return i.header.split('\n')
      } else {
        const lines = []
        if (i.ID) lines.push(i.ID)
        lines.push(`${i.genome} (${i.type || 'dna'})`)
        lines.push(trim(i.regions,30))
        return lines
      }
    }
  },
  mounted: function () {
    this.$watch('item', function () {this.$emit('item-changed')}, {deep:true})
    this.$el.scrollIntoView()
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
.m-button {
  font-size: 10px;
}
</style>
