<template>
  <div
    class="message flexrow"
    :class="{ faded : faded }"
    >
    <m-button
      class="material-icons close-btn"
      color="red"
      icon="highlight_off"
      @click="$emit('remove')"
      />
    <span>{{mText}}</span>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
export default MComponent({
  name: 'Message',
  components: { MButton },
  props: {
    mIdentifier : {
      type: Number,
      required: true
    },
    mText : {
      type: String,
      required: true
    },
    mType : {
      type: String,
      default: "info"
    },
    faded : {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style scoped>
.message {
  text-align: left;
  max-width: 250px;
  margin: 3px;
  background-color: white;
  border-radius: 3px;
  opacity: 1;
  transition: opacity 3s;
}
.message.faded {
  opacity: 0;
}
</style>
