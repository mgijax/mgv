<template>
  <div
    class="my-list-item flexrow"
    @click="clicked"
    draggable="true"
    @dragstart="dragStart($event)"
    >
    <m-button @click.stop="editClicked" title="Edit this list." :backgroundColor="item.color" icon="mode_edit" />
    <span style="width: 40%;">{{item.name}}</span>
    <span style="width: 20%;">{{item.items.length}}</span>
    <span style="font-size: smaller; width: 30%;">{{item.modified}}</span>
    <m-button title="Delete this list." icon="highlight_off" color="red" hoverBackgroundColor="red" @click.stop="deleteClicked"/>
  </div>
</template>

<script>
import MComponent from './MComponent.js'
import MButton    from './MButton.vue'
export default MComponent({
  name: 'MyListItem',
  props: ['item'],
  components: { MButton },
  mounted: function () {
    this.$parent.scrollToTop(this)
  },
  methods: {
    deleteClicked: function () {
      this.$root.ebus.emit('list-delete', this.item)
      this.app.logEvent('ListOp', 'delete')
    },
    clicked: function (evt) {
      this.$root.ebus.emit('list-click', { event: evt, list: this.item })
    },
    editClicked: function (evt) {
      this.$root.ebus.emit('list-edit-open', { event: evt, list: this.item })
      this.app.logEvent('ListOp', 'edit')
    },
    dragStart: function (evt) {
      let dt = evt.dataTransfer
      dt.setData('text', this.item.name)
    }
  }
})
</script>

<style scoped>
.my-list-item {
  font-size: 12px;
  background-color: #eee;
  border-radius: 4px;
  margin: 2px;
  border: thin solid transparent;
  min-height: 40px;
}
.my-list-item.current {
  border: thin solid #555;
}
.my-list-item:hover {
  background-color: #fff;
}
</style>
