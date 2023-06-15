<!--
  MStatus.vue

  Implements a simple status line component. 
  Listens for 'message' events and queues up the message for display.
  Queued messages are displayed briefly in turn (currently .5 sec) and
  the the final one is displayed longer (currently 2 sec). This approach
  spreads out (in time) the display of messages that can all queue up in
  the same tick.
-->
<template>
  <div class="status flexrow"
    :class="{ hidden: !status }"
    :style="style"
    >
      <span>{{status}}</span>
  </div>

</template>

<script>
import MComponent from './MComponent.js'
import config     from '../config.js'
export default MComponent({
  name: 'MStatus',
  props: ['version'],
  data: function () {
    return {
      style: config.MStatus.style,
      status: '',
      queue: [],
      timeout: null,
      displayTime: config.MStatus.displayTime,
      intervalTotal: 0
    }
  },
  methods: {
    addMessage: function (m) {
      this.queue.push(m)
      if (!this.timeout) {
        this.nextMessage()
        this.startTimeout()
      }
    },
    nextMessage: function () {
      this.status = this.queue.shift() || ''
    },
    startTimeout: function () {
      this.timeout = window.setTimeout(() => {
        if (this.queue.length) {
          this.nextMessage()
          this.startTimeout()
        } else {
          this.status = ''
          this.timeout = null
        }
      }, this.displayTime )
    }
  },
  mounted: function () {
    this.$root.ebus.on('message', d => this.addMessage(d.message))
  }
})
</script>

<style scoped>
.status {
  height: 25px;
  width: 100%;
  z-index: 200;
  font-size: 12px;
  font-weight: bold;
  transition: height 0.5s, opacity 0.5s;
  justify-content: center;
}
.hidden {
  height: 0px;
  opacity: 0;
}
</style>
