<template>
<div class="pagebox"
    :class="{dragging: isDragging, open: isOpen, closed: !isOpen, floating: floating, busy: isBusy}"
    :style="{top: y + ddData.dy + 'px', left: x + ddData.dx + 'px'}"
    >
    <div class="flexrow label-wrapper">
      <div name="label" >
            <i
              v-if="icon"
              class="material-icons"
              >{{ icon }}</i>
            {{label}}
            <i
              v-if="message"
              class="material-icons message"
              :title="message"
              @click.stop="messageClickHandler ? messageClickHandler() : null"
              >{{ messageIcon || 'warning'}}</i>
      </div>
      <div class="header-bar flexrow"
          title="Click to open/close. Drag to reposition."
          @click="toggleOpen"
          draggable="true"
          @dragstart="dragStart"
          @dragend="dragEnd"
          >
          <i class="material-icons close">close</i>
          <i class="material-icons add">add</i>
          </div>
  </div>
  <div name="content" v-show="isOpen">
    <slot></slot>
  </div>
  <canvas ref="canvas" width=1 height=1 />
  <div
    class="busybox"
    >
    <span>Busy...</span>
    </div>
</div>
</template>

<script>
import MComponent from './MComponent.js'
import MButton    from './MButton.vue'
import u          from '../lib/utils.js'
import { nextTick } from 'vue'
export default MComponent({
  name: 'PageBox',
  components: { MButton },
  props: {
    icon: String,
    label: String,
    message: String,
    messageClickHandler: Function,
    messageIcon: String,
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
      isBusy: false,
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
    toggleOpen: function (e) {
      if (e && e.shiftKey) {
        this.isOpen = true
        this.$emit('pagebox-open', this)
        this.$root.ebus.emit('pagebox-open-exclusive', this)
        u.unselectAllText()
      } else {
        this.isOpen = !this.isOpen
        this.$emit('pagebox-' + (this.isOpen ? 'open' : 'close'), this)
      }
    },
    open: function () {
      if (!this.isOpen) this.toggleOpen()
      this.x = Math.max(this.x, 0)
      this.y = Math.max(this.y, 0)
    },
    close: function () {
      if (this.isOpen) this.toggleOpen()
    },
    onExclusiveOpen (pb) {
      if (pb.$parent === this.$parent && pb !== this) {
        this.close()
      }
    },
    // -------------------------------
    // Drag and drop handlers. 
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
      //
      if (this.floating) {
        d.sibs = []
        d.myIndex = -1
      } else {
        d.sibs = u.getBBoxes(this.$parent.children, 'y')
        d.myIndex = d.sibs.map(s => s.component).indexOf(this)
      }
      //
      // Firefox drag event does not expose clientX, clientY 
      // (among others) - they are always 0. The workaround is to attach dragover listeners on
      // the document. Here, we attach the listener on dragstart and remove it on dragend.
      // This also works on chrome and safari.
      //
      d.listener = ev => this.drag(ev)
      document.addEventListener('dragover', d.listener)
    },
    drag: function (ev) {
      // console.log('PageBox.drag', ev)
      let d = this.ddData
      d.dy = ev.clientY - d.yStart
      if (this.floating) {
          d.dx = ev.clientX - d.xStart
          return
      }
      const mybb = this.$el.getBoundingClientRect()
      const osibs = d.sibs.map((s,i) => [s,i]).filter(s => {
        const overlaps = s[0].top <= mybb.bottom && s[0].bottom >= mybb.top
        const notme = s[1] !== d.myIndex
        return notme && overlaps
      })
      if (osibs.length === 0) return
      let imin, imax, delta
      if (d.dy < 0) {
        // dragging up => move items above me down
        imin = osibs[0][1]
        imax = d.myIndex - 1
        delta = mybb.height
      } else {
        // dragging down => move items below me up
        imin = d.myIndex + 1
        imax = osibs[osibs.length - 1][1]
        delta = -mybb.height
      }
      d.sibs.forEach((s,i) => {
        if (i !== d.myIndex) {
          s.component.ddData.dy = (i >= imin && i <= imax) ? delta : 0
        }
      })
    },
    dragEnd: function () {
      // console.log('PageBox.dragEnd', ev)
      document.removeEventListener('dragover', this.ddData.listener)
      this.isDragging = false
      let d = this.ddData
      if (this.floating) {
        this.x = Math.max(0, this.x + d.dx)
        this.y = Math.max(-50, this.y + d.dy)
      }
      d.dx = d.dy = 0
      if (!this.floating) d.sibs.forEach(s => { s.component.ddData.dy = 0 })
    }
    // end D&D handlers
    // -------------------------------
  },
  computed: {
    closeBtnIcon: function () {
      return this.isOpen ? this.iconClose : this.iconOpen
    },
    openHelpText: function () {
      return `Click to ${this.isOpen ? 'close' : 'open'}. Shift-click to open and close all others.`
    }
  },
  mounted: function () {
    this.$root.ebus.on('pagebox-open-exclusive', pb => this.onExclusiveOpen(pb))
    /*
    nextTick(() => {
      // At mount time, contained components have already been rendered.
      // Find the content component, which is the last.
      let lc = this.$refs.content = this.children[this.children.length - 1]
      if (!lc) throw 'Cannot find last child.'
      let htext = lc ? lc.$el.title : ''
      // move help text from component to this box's info button
      this.helpText = htext
      lc.$el.title = ''
      //
    })
    */
  }
})
</script>

<style scoped>
.pagebox {
  position: relative;
  padding: 6px;
  margin: 3px;
  background-color: var(--main-bg-color);
  border-radius: 3px;
  border: thin solid var(--main-bg-color);
}
.pagebox:hover,
.pagebox.dragging {
  border-color: black;
}
.pagebox.floating {
  position: absolute;
  border: thin solid black;
  z-index: 100;
  min-width: 250px;
  box-shadow: 6px 6px gray;
}
.pagebox.floating.closed {
  display: none;
}
.pagebox > .label-wrapper {
    position: sticky;
    top: 0px;
    background-color: var(--main-bg-color);
    justify-content: space-between;
    z-index: 100;
}
.pagebox > .label-wrapper > * {
    flex-grow: 0;
}
.pagebox > .label-wrapper > [name="label"] {
  font-weight: bold;
  text-align: start;
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--main-bg-color);
}
.pagebox > .label-wrapper > [name="label"] .material-icons {
  font-size: 14px;
}
.pagebox > .label-wrapper > .header-bar {
    flex-grow: 1;
    justify-content: flex-end;
    cursor: pointer;
    height: 1em;
}
.pagebox .header-bar .material-icons {
    font-size: 18px;
}
.pagebox.open .header-bar .add {
    display: none;
}
.pagebox.closed .header-bar .close {
    display: none;
}

.pagebox.dragging > .label-wrapper > .header-bar {
  cursor: grabbing !important;
  cursor: -webkit-grabbing !important;
}
.pagebox [name="buttonBox"] {
}
.pagebox [name="buttonBox"] .m-button {
  margin-right: 8px;
}
.pagebox canvas {
  position: absolute;
}
.pagebox .m-button[name="dragHandle"] {
  cursor: grab;
  cursor: -webkit-grab;
}
.pagebox.dragging {
    z-index: 500;
}
.pagebox i.message {
  font-size: 16px;
  color: #ff9800;
  cursor: pointer;
  position: relative;
  top: 2px;
}
.pagebox [name="buttonBox"] {
  display: none;
}
.busybox {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  color: white;
  background-color: rgba(0,0,0,0.8);
  display: none;
}
.busy .busybox {
  display: block
}
</style>
