<template>
  <div class="list-editor">
    <form>
      <table>
        <tr>
          <td><label>Name</label></td>
          <td><input name="name" v-model="name" /></td>
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
            <textarea ref="textarea" name="items" rows=10 v-model="itemsText" />
          </td>
        </tr>
        <tr>
         <td colspan="2">
           <div class="flexrow dropzone">
             <div
               name="union"
               title="Drag a list here to ADD its items to the current list."
               @dragover="dragover"
               @dragleave="dragleave"
               @drop="drop"
               >∪</div>
             <div
               name="intersection"
               title="Drag a list here to INTERSECT its items with the current list."
               @dragover="dragover"
               @dragleave="dragleave"
               @drop="drop"
               >∪</div>
             <div
               name="difference"
               title="Drag a list here to REMOVE its items from the current list."
               @dragover="dragover"
               @dragleave="dragleave"
               @drop="drop"
               >—</div>
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
      color: '#000000',
      items: [],
      pickerOpen: false,
      pickerColor: '#000000'
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
    list: function () { this.reset() },
    pickerColor: function (c) {
      console.log('Color changed.', c)
      this.color = c.hex
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
    togglePicker: function () {
      this.pickerOpen = !this.pickerOpen
    },
    getDropTarget: function (evt) {
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
      let dt = evt.dataTransfer
      let listName = dt.getData('text')
      let list = this.listManager().getList(listName)
      let dtgt = this.getDropTarget(evt)
      dtgt.className = ''
      let op = dtgt.getAttribute('name')
      this[op](list)
    },
    open: function () {
      this.$parent.open()
      this.reset()
    },
    close: function () {
      this.$parent.close()
    },
    reset: function () {
      if (this.list) {
        this.$parent.open()
        Object.assign(this.$data, JSON.parse(JSON.stringify(this.list)))
      } else {
        Object.assign(this.$data, {
          name: '',
          created: '',
          modified: '',
          color: '#000000',
          items: []
        })
      }
    },
    save: function () {
      let tv = this.$refs.textarea.value
      this.items = tv.split(/\s+/).filter(x => x)
      this.$root.$emit('list-edit-save', this.$data)
    },
    create: function () {
      let tv = this.$refs.textarea.value
      this.items = tv.split(/\s+/).filter(x => x)
      this.$root.$emit('list-edit-new', this.$data)
    },
    clear: function () {
      this.$root.$emit('list-edit-cancel')
    },
    cancel: function () {
      this.$root.$emit('list-edit-cancel')
      this.$parent.close()
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
    }
  }
})
</script>

<style scoped>
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
  flex-grow: 1;
  border: thin solid gray;
}
.dropzone > div[name="intersection"] {
  transform: rotate(180deg);
}
.dropzone > div.candrop {
  background-color: green;
}
</style>
