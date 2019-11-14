<template>
  <div class="sequence-cart">
     <!-- Cart items -->
     <span>{{ cart.length }} sequence{{ cart.length === 1 ? '' : 's' }}</span>
     <div class="sequence-cart-items">
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

       <!-- Delete selected button -->
       <m-button
         icon="delete"
         color="red"
         title="Remove selected items from the cart."
         @click="clearSelected"
         :disabled="cartEmpty"
         />

     </div>
     <div v-show="nothingSelected && !cartEmpty" class="flexrow" style="justify-content: center;">
       <i class="material-icons" style="font-size: 18px;">cloud_download</i>
       <span>Nothing selected.</span>
     </div>
     <div v-show="!nothingSelected" class="flexcolumn">
       <!-- Download form -->
       <form
         ref="sequenceDownloadForm"
         :action="fetchUrl"
         target="_blank"
         method="POST"
         download>
         <input type="hidden" name="descriptors" v-model="descriptors"></textarea>
	 <div class="flexcolumn" style="padding-right: 12px;">
	     <div class="flexrow download-option">
	       <!-- Download button -->
	       <m-button
		 icon="cloud_download"
		 title="Download selected sequences to a file. Enter file name."
		 @click="downloadToFile"
		 :disabled="nothingSelected || noFileName"
		 />
               <label>File</label>
	       <input
                 v-model="filename"
                 name="filename"
                 type="text"
                 :disabled="cartEmpty"
                 placeholder="Enter file name."></input>
	     </div>
	     <div class="flexrow download-option">
	       <!-- View in browser -->
	       <m-button
		 icon="cloud_download"
		 title="Download selected sequences to a new browser tab."
		 @click="downloadToBrowser"
		 :disabled="nothingSelected"
		 />
               <label>Browser</label>
             </div>
             <div class="flexrow download-option">
	       <!-- Copy to clipboard -->
	       <m-button
		 icon="cloud_download"
		 title="Copy selected sequences to the clipboard."
		 @click="downloadToClipboard"
		 :disabled="nothingSelected"
                 v-show="!cbText"
		 />
               <label v-show="!cbText">Clipboard</label>
               <label v-show="cbText">Confirm:</label>
               <m-button
                 icon="check_circle"
                 color="green"
                 title="Confirm"
                 @click="downloadToClipboardPt2"
                 v-show="cbText"
                 />
               <m-button
                 icon="cancel"
                 color="red"
                 title="Cancel"
                 @click="cancelClipboard"
                 v-show="cbText"
                 />
               <span
                 v-show="cbText"
                 >{{cbText.length}} chars</span>
	     </div>
	 </div>
       </form>
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
      fetched: '',
      cbText: '',
      filename: ''
    }
  },
  computed: {
    cartEmpty () {
      return this.cart.length === 0
    },
    selected () {
      return this.cart.filter(item => item.selected)
    },
    selectedLength () {
      return this.selected.reduce((a,v) => a + v.totalLength, 0)
    },
    nothingSelected () {
      return this.selected.length === 0
    },
    noFileName () {
      return ! this.filename
    },
    fetchUrl () {
      return this.app.runtimeConfig.dataUrl + "fetch.cgi"
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
    downloadToFile: function () {
      if (this.nothingSelected) return
      this.descriptors = JSON.stringify(this.selected)
      this.$nextTick(() => {
          this.$refs.sequenceDownloadForm.submit()
      })
      this.app.logEvent('DownloadSequence', 'file', this.selectedLength)
    },
    downloadToClipboard: function () {
      if (this.nothingSelected) return
      this.dataManager().getSequences(this.selected).then(text => { this.cbText = text })
    },
    downloadToClipboardPt2: function () {
      const dummy = document.createElement("textarea")
      document.body.appendChild(dummy);
      dummy.value = this.cbText
      dummy.select();
      document.execCommand("copy");
      document.body.removeChild(dummy);
      this.cbText = ''
      this.app.logEvent('DownloadSequence', 'clipboard', this.selectedLength)
    },
    cancelClipboard: function () {
      this.cbText = ''
    },
    downloadToBrowser: function () {
      if (this.nothingSelected) return
      this.dataManager().getSequences(this.selected).then(text => {
	const w = window.open("","_blank")
	w.document.write('<pre>', text, '</pre>')
        this.app.logEvent('DownloadSequence', 'browser', this.selectedLength)
      })
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
      rs.unselectAll && this.unselectAll()
      rs.sequences.forEach(r => this.add(r))
      this.app.openDrawer()
      this.$parent.open()
      this.$el.scrollIntoView()
      if (rs.sequences.length) {
        // this.$root.$emit('message', { message: `Added ${rs.sequences.length} sequences to cart` })
      }
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
  max-height: 250px;
  overflow: scroll;
}
.download-option {
  justify-content: flex-start;
}
.download-option > * {
  margin-left: 12px;
}
</style>
