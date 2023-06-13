<template>
  <div class="sequence-cart">
     <!-- Cart items -->
     <span v-show="cart.length > 0">{{ cart.length }} sequence{{ cart.length === 1 ? '' : 's' }}</span>
     <div class="sequence-cart-items" v-if="cart.length">
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

       <!-- Selected count and length  -->
       <div style="flex-grow: 1;"></div>
       <span style="font-size: 12px;">{{selectedLengthLabel}}</span>
       <span v-if="warningMessage" class="warning"><i class="material-icons" :title="warningMessage">warning</i></span>
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
     <div class="flexcolumn">
       <!-- Download form -->
       <form
         ref="sequenceDownloadForm"
         :action="fetchUrl"
         target="_blank"
         method="POST"
         download>
         <input type="hidden" name="datatype" value="fasta" />
         <input type="hidden" name="descriptors" v-model="descriptors" />
         <div class="flexcolumn" style="padding-right: 12px;">
             <div class="flexrow download-option">
               <!-- Download button -->
               <m-button
                 icon="cloud_download"
                 title="Download selected sequences to a file. Enter file name."
                 @click="downloadTo('file')"
                 :disabled="nothingSelected || noFileName"
                 />
               <label>File</label>
               <input
                 v-model="filename"
                 name="filename"
                 type="text"
                 :disabled="cartEmpty"
                 @keypress="filenameKeypress"
                 placeholder="Enter file name." />
             </div>
             <div class="flexrow download-option">
               <!-- View in browser -->
               <m-button
                 icon="cloud_download"
                 title="Download selected sequences to a new browser tab."
                 @click="downloadTo('browser')"
                 :disabled="nothingSelected"
                 />
               <label>Browser</label>
             </div>
             <div class="flexrow download-option">
               <!-- Copy to clipboard -->
               <m-button
                 icon="cloud_download"
                 title="Copy selected sequences to the clipboard."
                 @click="downloadTo('clipboard')"
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
import u                from '../lib/utils.js'
import MComponent       from './MComponent.js'
import MButton          from './MButton.vue'
import SequenceCartItem from './SequenceCartItem.vue'
import KeyStore         from '../lib/KeyStore.js'
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
    selectedCount () {
      return this.selected.length
    },
    warningMessage () {
      if (this.selectedCount > this.cfg.maxDownloadCount) {
        return `Selected items exceed maximum download count of ${this.cfg.maxDownloadCount}.`
      } else if (this.selectedLength > this.cfg.maxDownloadLength) {
        return `Selected items exceed maximum download size of ${u.prettyPrintBases(this.cfg.maxDownloadLength)}.`
      } else {
        return ''
      }
    },
    selectedLength () {
      return this.selected.reduce((a,v) => a + v.totalLength, 0)
    },
    selectedLengthLabel () {
      if (this.cartEmpty) return "Cart is empty."
      const n = this.selected.length
      if (n === 0) return "Nothing selected."
      const len = u.prettyPrintBases(this.selectedLength)
      return `${this.selected.length} selected, ${len}`
    },
    nothingSelected () {
      return this.selected.length === 0
    },
    noFileName () {
      return ! this.filename
    },
    fetchUrl () {
      return this.app.dataManager.fetchUrl
    }
  },
  methods: {
    add (r) {
      // standardize these fields
      r.selected = r.selected || false
      r.reverse = r.reverse || false
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
    filenameKeypress: function (e) {
      if (e.keyCode === 13) {
        e.preventDefault()
        this.downloadTo('file')
        return false
      }
    },
    downloadTo: function (where) {
      if (this.nothingSelected) return
      if (this.warningMessage) {
        this.app.logEvent('DownloadSequence', 'BLOCKED', this.selectedLength)
        alert(this.warningMessage + ' Please deselect some sequences and try again.')
        return
      }
      this.app.logEvent('DownloadSequence', where, this.selectedLength)
      switch(where) {
      case 'file':
          this.downloadToFile()
          break
      case 'clipboard':
          this.downloadToClipboard()
          break
      case 'browser':
          this.downloadToBrowser()
          break
      }
    },
    downloadToFile: function () {
      this.descriptors = JSON.stringify(this.selected)
      this.$nextTick(() => {
          this.$refs.sequenceDownloadForm.submit()
      })
    },
    downloadToClipboard: function () {
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
    },
    cancelClipboard: function () {
      this.cbText = ''
    },
    downloadToBrowser: function () {
      this.dataManager().getSequences(this.selected).then(text => {
        const w = window.open("","_blank")
        w.document.write('<pre>', text, '</pre>')
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
  created: function () {
    this.$root.$on('sequence-selected', rs => {
      rs.unselectAll && this.unselectAll()
      rs.sequences.forEach(r => this.add(r))
      this.app.openDrawer()
      this.$parent.open()
      this.$el.scrollIntoView()
      if (rs.sequences.length) {
        this.$root.$emit('message', { message: `Added ${rs.sequences.length} sequences to cart` })
      }
    })
    this.$root.$once('mgv-initialized', () => {
        // have to wait til MGV is initialized before restoring sequences because we
        // need to be able to resolve genome names.
        this.kstore = new KeyStore(this.cfg.dbName)
        this.restore()
    })
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
  overflow-y: scroll;
}
.download-option {
  justify-content: flex-start;
}
.download-option > * {
  margin-left: 12px;
}
.warning .material-icons {
   font-size:12px;
   color: #ff9800;
   cursor: pointer;
}
</style>
