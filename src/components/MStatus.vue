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
import MComponent from '@/components/MComponent'
import config from '@/config'
export default MComponent({
  name: 'MStatus',
  props: ['version'],
  data: function () {
    return {
      style: config.MHeader.style,
      status: '',
      queue: [],
      timeout: null,
      shortInterval: 500,
      longInterval: 2000,
      intervalTotal: 0
    }
  },
  methods: {
    addMessage: function (m) {
      this.queue.push(m)
      if (!this.timeout) this.startTimeout()
    },
    nextMessage: function () {
      this.status = this.queue.shift() || ''
    },
    startTimeout: function () {
      this.timeout = window.setInterval(() => {
        if (this.queue.length) {
          this.nextMessage()
          this.intervalTotal = 0
        } else {
          this.intervalTotal += this.shortInterval
          if (this.intervalTotal >= this.longInterval) {
            this.status = ''
            this.intervalTotal = 0
            window.clearInterval(this.timeout)
            this.timeout = null
          }
        }
      }, this.shortInterval)
    }
  },
  mounted: function () {
    this.$root.$on('message', d => this.addMessage(d.message))
  }
})
</script>

<style scoped>
.status {
  height: 25px;
  width: 100%;
  font-size: 12px;
  font-weight: bold;
  transition: height 0.5s;
}
.hidden {
  height: 0px;
}
</style>
