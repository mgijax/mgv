<template>
  <div class="sequence-cart">
     <!-- Cart items -->
     <div class="sequence-cart-items">
       <span>{{ cart.length }} sequence{{ cart.length === 1 ? '' : 's' }}</span>
       <sequence-cart-item
         v-for="item in cart"
         :key="item.name"
         :item="item"
         ref="items"
         @delete-me="deleteItem"
         @item-changed="save"
         />
     </div>
     <!-- row of buttons -->
     <div class="flexrow">
       <!-- Select all button -->
       <m-button
         icon="check_box"
         title="Select all items in the cart."
         @click="selectAll"
         :disabled="cartEmpty"
         />

       <!-- Unselect all button -->
       <m-button
         icon="check_box_outline_blank"
         title="Un-select all items in the cart."
         @click="unselectAll"
         :disabled="cartEmpty"
         />

       <!-- spacer -->
       <div style="flex-grow: 1;"></div>

       <!-- Download form -->
       <form
         ref="sequenceDownloadForm"
         :action="fetchUrl"
         target="_blank"
         method="POST"
         download>
         <input type="hidden" name="descriptors" v-model="descriptors"></textarea>
	 <div class="flexcolumn">
	     <div v-show="fetched.length === 0" class="flexrow">
	       <input name="filename" type="text" :disabled="cartEmpty" placeholder="Enter file name."></input>
	       <!-- Download button -->
	       <m-button
		 icon="cloud_download"
		 title="Download selected sequences in Fasta format."
		 @click="downloadSelected"
		 :disabled="cartEmpty"
		 />
	     </div>
	     <div v-show="fetched.length > 0" class="flexrow">
	       <!-- Fetched summary -->
	       <span>Fetched {{fetched.length}} chars</span>
	       <!-- View in browser -->
	       <m-button
		 icon="subject"
		 title="View."
		 @click="viewFetched"
		 />
	       <!-- Copy to clipboard -->
	       <m-button
		 icon="file_copy"
		 title="Copy to clipboard."
		 @click="copyFetched"
		 />
	     </div>
	 </div>
       </form>

       <!-- spacer -->
       <div style="flex-grow: 1;"></div>

       <!-- Delete selected button -->
       <m-button
         icon="delete"
         color="red"
         title="Remove selected items from the cart."
         @click="clearSelected"
         :disabled="cartEmpty"
         />

     </div>
  </div>
</template>

<script>
import config from '@/config'
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import SequenceCartItem from '@/components/SequenceCartItem'
import KeyStore from '@/lib/KeyStore'
export default MComponent({
  name: 'SequenceCart',
  components: { SequenceCartItem, MButton },
  inject: ['dataManager'],
  data: function () {
    return {
      cart: [],
      descriptors: '',
      bottomShowing: false,
      fetched: ''
    }
  },
  computed: {
    cartEmpty () {
      return this.cart.length === 0
    },
    fetchUrl () {
      return config.DataManager.fetchUrl
    }
  },
  methods: {
    add (r) {
      // standardize these fields
      r.selected = r.selected || false
      r.reverseComplement = r.reverseComplement || false
      r.translate = r.translate || false
      this.cart.push(r)
      this.save()
    },
    clear () {
      this.cart = []
      this.save()
    },
    clearSelected () {
      this.cart = this.cart.filter(item => !item.selected)
      this.save()
    },
    deleteItem: function (item) {
      const i = this.cart.indexOf(item)
      if (i >= 0) {
        this.cart.splice(i, 1)
        this.save()
      }
    },
    selectAll: function () {
      this.cart.forEach(item => {item.selected = true})
    },
    unselectAll: function () {
      this.cart.forEach(item => {item.selected = false})
    },
    downloadSelected: function () {
      const selected = this.cart.filter(item => item.selected)
      if (selected.length === 0) return
      if (this.$refs.sequenceDownloadForm.filename.value) {
	  // if filename is specified, use form submission mentod
	  this.descriptors = JSON.stringify(selected)
	  this.$nextTick(() => {
	      this.$refs.sequenceDownloadForm.submit()
	      this.$refs.sequenceDownloadForm.reset()
	  })
      } else {
          // no filename - use fetch
	  this.dataManager().getSequences(selected).then(text => {
	    this.fetched = text
	  })
      }
    },
    viewFetched: function () {
	const w = window.open("","_blank")
	w.document.write('<pre>', this.fetched, '</pre>')
	this.fetched = ''
    },
    copyFetched: function () {
        const dummy = document.createElement("textarea")
        document.body.appendChild(dummy);
        dummy.value = this.fetched;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
	this.fetched = ''
    },
    save () {
      return this.kstore.set('all', this.cart.map(seq => {
        // sequences have actual genome objects. For db store, just want the name.
        const obj = Object.assign({}, seq)
        //obj.genome = obj.genome.name
        return obj
      }))
    },
    restore () {
      return this.kstore.get('all').then(all => {
        if (all) {
          this.cart = all.map(obj => {
            // look up the genome name, convert to actual genome
            const g = this.dataManager().lookupGenome(obj.genome)
            if (g) {
              //obj.genome = g
              return obj
            }
            return null
          }).filter(x => x)
        }
      })
    }

  },
  mounted: function () {
    this.$root.$on('sequence-selected', rs => {
      this.unselectAll()
      rs.forEach(r => this.add(r))
    })
    this.kstore = new KeyStore(this.cfg.dbName)
    this.restore()
  }
})
</script>

<style scoped>
.sequence-cart {
}
.sequence-cart .m-button {
  padding: 0px;
}
.sequence-cart-items {
  max-height: 450px;
  overflow: scroll;
}
</style>
