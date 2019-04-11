<template>
<div class="pagebox"
    :class="{dragging: isDragging, open: isOpen, closed: !isOpen, floating: floating}"
    :style="{top: y + ddData.dy + 'px', left: x + ddData.dx + 'px'}"
    >
  <div name="buttonBox" class="flexrow">
    <m-button
      name="info"
      :title="helpText"
      :style="{ display: helpText ? 'default' : 'none' }"
      icon="help_outline"
      />
    <m-button
      name="close"
      :title="openHelpText"
      @click.native="toggleOpen"
      :icon="closeBtnIcon"
      />
    <m-button
      v-show="draggable"
      name="dragHandle"
      title="Drag up/down to reposition."
      icon="drag_indicator"
      draggable="true"
      @dragstart="dragStart"
      @dragend="dragEnd"
      />
  </div>
  <div name="label">
    {{label}}
    <i
      v-if="message"
      class="material-icons message"
      :title="message"
      >warning</i>
  </div>
  <div name="content" v-show="isOpen">
    <slot></slot>
  </div>
  <canvas ref="canvas" width=1 height=1 />
</div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import Vue from 'vue'
export default MComponent({
  name: 'PageBox',
  components: { MButton },
  props: {
    label: String,
    message: String,
    floating: Boolean,
    initialX: {
      type: Number,
      default: 0
    },
    initialY: {
      type: Number,
      default: 0
    },
    initiallyOpen: {
      type: Boolean,
      default: true
    },
    draggable: {
      type: Boolean,
      default: true
    },
    iconOpen: {
      type: String,
      default: 'add'
    },
    iconClose: {
      type: String,
      default: 'close'
    }
  },
  data () {
    return {
      isOpen: this.initiallyOpen,
      isDragging: false,
      x: this.initialX,
      y: this.initialY,
      ddData: {
        xStart: 0, // clientX of drag start
        yStart: 0, // clientY of drag end
        dx: 0, // current drag translation X amount
        dy: 0 // current drag translation Y amount
      },
      helpText: 'Heeeeelp!!',
    }
  },
  created: function () {
    // console.log("PageBox.created:", this.label)
  },
  methods: {
    toggleOpen: function () {
      this.isOpen = !this.isOpen
      this.$emit('pagebox-' + (this.isOpen ? 'open' : 'close'), this)
    },
    open: function () {
      if (!this.isOpen) this.toggleOpen()
      this.x = Math.max(this.x, 0)
      this.y = Math.max(this.y, 0)
    },
    close: function () {
      if (this.isOpen) this.toggleOpen()
    },
    // -------------------------------
    // Drag and drop handlers. NOTE that Firefox drag event do not expose clientX, clientY 
    // (among others) - they are always 0. The workaround is to attach dragover listeners on
    // the document. Here, we attach the listener on dragstart and remove it on dragend.
    // This also works on chrome and safari.
    dragStart: function (ev) {
      // console.log('PageBox.dragStart', ev)
      let dt = ev.dataTransfer
      dt.setData('text', this.label)
      dt.effectAllowed = 'move'
      dt.dropEffect = 'move'
      dt.setDragImage(this.$refs.canvas, 0, 0)
      //
      this.isDragging = true
      let d = this.ddData
      d.xStart = ev.clientX
      d.yStart = ev.clientY
      d.dx = 0
      d.dy = 0
      d.listener = ev => this.drag(ev)
      document.addEventListener('dragover', d.listener)
    },
    drag: function (ev) {
      // console.log('PageBox.drag', ev)
      let d = this.ddData
      if (this.floating) d.dx = ev.clientX - d.xStart
      d.dy = ev.clientY - d.yStart
    },
    dragEnd: function (ev) {
      // console.log('PageBox.dragEnd', ev)
      document.removeEventListener('dragover', this.ddData.listener)
      this.isDragging = false
      let d = this.ddData
      if (this.floating) {
        this.x = Math.max(0, this.x + d.dx)
        this.y = Math.max(0, this.y + d.dy)
      }
      d.dx = d.dy = 0
    }
    // end D&D handlers
    // -------------------------------
  },
  computed: {
    closeBtnIcon: function () {
      return this.isOpen ? this.iconClose : this.iconOpen
    },
    openHelpText: function () {
      return `Click to ${this.isOpen ? 'close' : 'open'}.`
    }
  },
  mounted: function () {
    Vue.nextTick(() => {
      // At mount time, contained components have already been rendered.
      // Find the content component, which is the last.
      let lc = this.$refs.content = this.$children[3]
      if (!lc) console.log ('Cannot find last child.', this)
      let htext = lc ? lc.$el.title : ''
      // move help text from component to this box's info button
      this.helpText = htext
      lc.$el.title = ''
      //
      this.$parent.$refs[this.label] = this
    })
  }
})
</script>

<style scoped>
.pagebox {
  position: relative;
  padding: 6px;
  margin: 3px;
  background-color: #e1e1e1;
  border-radius: 2px;
}
.pagebox.floating {
  position: absolute;
  outline: thin solid black;
  z-index: 100;
  min-width: 250px;
}
.pagebox.floating.closed {
  display: none;
}
.pagebox > [name="label"] {
  font-weight: bold;
  text-align: start;
}
.pagebox:hover {
  outline: thin solid black;
}
.pagebox [name="buttonBox"] {
  position: absolute;
  top: 2px;
  right: 2px;
}
.pagebox [name="buttonBox"] .m-button {
  margin-right: 8px;
}
.pagebox canvas {
  position: absolute;
}
.pagebox .button[name="dragHandle"] {
  cursor: grab !important;
  cursor: -webkit-grab !important;
}
.pagebox.dragging {
    z-index: 100;
}
.pagebox.dragging .button[name="dragHandle"] {
  cursor: grabbing !important;
  cursor: -webkit-grabbing !important;
}
.pagebox.closed > [name="content"] {
}
.pagebox i.message {
  font-size: 16px;
  color: #ff9800;
  cursor: pointer;
  position: relative;
  top: 2px;
}
</style>
