<template>
  <div 
    v-if="messageList.length"
    class="messages flexcolumn"
    >
    <message
      v-for="m in messageList"
      :key="m.count"
      :mIdentifier="m.count"
      :mText="m.message"
      :faded="m.faded"
      @remove="remove(m)"
      />
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import Message from '@/components/Message'
export default MComponent({
  name: 'Messages',
  components: { Message },
  data: function () {
    return {
      count: 0,
      messageList: []
    }
  },
  mounted: function () {
    this.$root.$on('message', m => {
      this.count += 1
      m.count = this.count
      m.faded = false
      this.messageList.push(m)
      this.timedRemove(m)
    })
  },
  methods: {
    timedRemove(m) {
       window.setTimeout(() => {
         m.faded = true
         window.setTimeout(() => {
           this.remove(m)
         }, 3000)
       }, 1000)
    },
    remove (m) {
      const i = this.messageList.indexOf(m)
      if (i >= 0) {
        this.messageList.splice(i, 1)
      }
    },
    removeAll () {
      this.messageList = []
    }
  }
})
</script>

<style scoped>
.messages {
  position: fixed;
  left: 2px;
  top: 2px;
}
.close-btn {
  color: red;
  font-size: 16px;
  cursor: pointer;
}
</style>
