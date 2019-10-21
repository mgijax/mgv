<template>
  <div class="list-editor">
    <form>
      <table>
        <tr>
          <td><label>Name</label></td>
          <td><input name="name" v-model="name" /></td>
        </tr>
        <tr>
          <td><label>Description</label></td>
          <td><textarea name="description" v-model="description" placeholder="Description of this list."/></td>
        </tr>
        <tr>
          <td><label>Color</label></td>
          <td>
            <div class="flexcolumn">
              <div class="swatch"
                :style="{ backgroundColor: color }"
                @click="togglePicker"
                :title="`Click to ${pickerOpen ? 'close' : 'open'} the color picker.`"
                />
              <color-picker
                v-show="pickerOpen"
                v-model="pickerColor"
                style="max-width: 200px;"
                />
            </div>
          </td>
        </tr>
        <tr>
          <td>
            <div class="flexcolumn">
              <label>Items</label>
              <span>({{items.length}})</span>
            </div>
          </td>
          <td>
            <textarea 
               v-model="itemsText"
               ref="textarea"
               name="items"
               rows=10
               @dragover="dragover"
               @dragleave="dragleave"
               @drop="drop"
               />
          </td>
        </tr>
        <tr>
         <td></td>
         <td>
           <div class="flexrow dropzone">
             <div
               name="union"
               class="listop"
               title="DRAG a list here to ADD its items to this list. CLICK here to add the current selection."
               @dragover="dragover"
               @dragleave="dragleave"
               @drop="drop"
               @click="addSelected"
               >
                 <div class="circle c1"></div>
                 <div class="circle c2"></div>
                 <label>union</label>
               </div>
             <div
               name="intersection"
               class="listop"
               title="DRAG a list here to INTERSECT its items with this list. CLICK here to intersect with the current selection."
               @dragover="dragover"
               @dragleave="dragleave"
               @drop="drop"
               @click="intersectWithSelected"
               >
                 <div class="circle c1"></div>
                 <div class="circle c2"></div>
                 <label>intersection</label>
               </div>
             <div
               name="difference"
               class="listop"
               title="DRAG a list here to REMOVE its items from this list. CLICK here to remove the current selection."
               @dragover="dragover"
               @dragleave="dragleave"
               @drop="drop"
               @click="removeSelected"
               >
                 <div class="circle c1"></div>
                 <div class="circle c2"></div>
                 <label>difference</label>
               </div>
           </div>
         </td>
        </tr>
        <tr class="date">
          <td><label>Created</label></td>
          <td><span>{{ created }}</span></td>
        </tr>
        <tr class="date">
          <td><label>Modified</label></td>
          <td><span>{{ modified }}</span></td>
        </tr>
        <tr>
          <td colspan=2>
            <button type="button" value="cancel" @click="cancel">Cancel</button>
            <button v-if="list" type="button" value="save" @click="save">Save</button>
            <button v-if="!list" type="button" value="create" @click="create">Create</button>
          </td>
        </tr>
      </table>
    </form>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import { Chrome } from 'vue-color'
export default MComponent({
  name: 'ListEditor',
  components: {
    MButton,
    ColorPicker: Chrome
  },
  props: {
    list: Object
  },
  inject: ['listManager'],
  data: function () {
    return {
      name: '',
      created: '',
      modified: '',
      description: '',
      color: '#000000',
      items: [],
      pickerOpen: false,
      pickerColor: { hex8: '#000000ff' }
    }
  },
  computed: {
    itemsText: {
      get: function () {
        return this.items.join('\n')
      },
      set: function (val) {
        // let v = this.$refs.textarea.value
        // let titems = v.split(/\s+/).filter(x => x)
      }
    }
  },
  watch: {
    list: function () {
      this.reset()
    },
    pickerColor: function (c) {
      this.color = c.hex8 || c
    }
  },
  mounted: function () {
    this.app.$root.$on('list-delete', d => {
      if (this.list === d) {
        this.cancel()
      }
    })
  },
  methods: {
    open: function () {
      this.closePicker()
      this.$parent.open()
      this.reset()
    },
    close: function () {
      this.$parent.close()
    },
    openPicker: function () {
      this.pickerOpen = true
    },
    closePicker: function () {
      this.pickerOpen = false
    },
    togglePicker: function () {
      this.pickerOpen = !this.pickerOpen
    },
    getDropTarget: function (evt) {
      if (evt.target.tagName.toLowerCase() === 'textarea') {
        return evt.target
      }
      return evt.target.closest('.dropzone > div')
    },
    dragover: function (evt) {
      evt.preventDefault()
      this.getDropTarget(evt).className = 'candrop'
    },
    dragleave: function (evt) {
      this.getDropTarget(evt).className = ''
    },
    drop: function (evt) {
      evt.preventDefault()
      this.dragleave(evt)
      let dt = evt.dataTransfer
      let listName = dt.getData('text')
      let list = this.listManager().getList(listName)
      let dtgt = this.getDropTarget(evt)
      let op = dtgt.getAttribute('name')
      if (op === 'items') op = 'replace'
      this[op](list)
    },
    reset: function () {
      if (this.list) {
        let l = this.list
        this.name = l.name
        this.description = l.description
        this.color = l.color
        this.created = l.created.toDateString() + ' ' + l.created.toLocaleTimeString()
        this.modified = l.modified.toDateString() + ' ' + l.modified.toLocaleTimeString()
        this.items = JSON.parse(JSON.stringify(l.items))
        this.pickerOpen = false
        this.pickerColor = this.color
        this.$parent.open()
      } else {
        this.name = ''
        this.color = '#000000'
        this.created = ''
        this.modified = ''
        this.items = []
        this.pickerOpen = false
        this.pickerColor = this.color
      }
    },
    save: function () {
      let tv = this.$refs.textarea.value
      this.items = tv.split(/\s+/).filter(x => x)
      this.$root.$emit('list-edit-save', this.$data)
      this.$parent.close()
    },
    create: function () {
      let tv = this.$refs.textarea.value
      this.items = tv.split(/\s+/).filter(x => x)
      this.$root.$emit('list-edit-new', this.$data)
      this.$parent.close()
    },
    clear: function () {
      this.$root.$emit('list-edit-cancel')
    },
    cancel: function () {
      this.$root.$emit('list-edit-cancel')
      this.$parent.close()
    },
    replace: function (lst) {
      this.items = []
      this.union(lst)
    },
    union: function (lst) {
      let s = new Set(this.items)
      lst.items.forEach(i => s.add(i))
      this.items = Array.from(s)
    },
    difference: function (lst) {
      let s = new Set(this.items)
      lst.items.forEach(i => s.delete(i))
      this.items = Array.from(s)
    },
    intersection: function (lst) {
      let s = new Set(this.items)
      let ss = new Set()
      lst.items.forEach(i => s.has(i) && ss.add(i))
      this.items = Array.from(ss)
    },
    addSelected: function () {
      this.union({items:this.app.currentSelectionToList})
    },
    removeSelected: function () {
      this.difference({items:this.app.currentSelectionToList})
    },
    intersectWithSelected: function () {
      this.intersection({items:this.app.currentSelectionToList})
    }
  }
})
</script>

<style scoped>
.list-editor {
  max-width: 300px;
}
.date {
  font-size: 12px;
}
.swatch {
  height: 20px;
  cursor: pointer;
}
table {
  width: 100%;
}
td:nth-child(2) * {
  width: 100%;
}
textarea {
  resize: vertical;
  -webkit-box-sizing: content-box;
  -moz-box-sizing: content-box;
  box-sizing: content-box;
}
.dropzone {
  font-size: 48px;
}
.dropzone > div {
  position: relative;
  border: thin solid #aaa;
  height: 60px;
  width: 60px;
}
.dropzone label {
  font-size: 10px;
}
.candrop {
  background-color: green;
}
.circle {
  height: 20px !important;
  width: 20px !important;
  border-radius: 10px;
  background-color: blue;
  position: absolute;
  top: 22px;
  left: 18px;
}
.circle.c2 {
  left: 28px;
}
.listop:hover {
  color: black;
  border-color: black;
}
[name="union"] .circle {
  opacity: 0.9;
}
[name="intersection"] .circle {
  opacity: 0.5;
}
[name="difference"] .circle.c2 {
  background-color: #cccccceb;
}
</style>
