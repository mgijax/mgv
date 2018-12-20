<template>
  <i
    class="material-icons button"
    v-on="$listeners"
    :style="style"
    @mouseover="hover=true"
    @mouseout="hover=false"
    >{{icon}}</i>
</template>

<script>
import MComponent from '@/components/MComponent'
export default MComponent({
  name: 'MButton',
  props: {
    icon: {
      default: ''
    },
    color: {
      default: 'black'
    },
    backgroundColor: {
      default: null
    },
    hoverColor: {
      default: 'white'
    },
    hoverBackgroundColor: {
      default: 'rgb(31, 119, 180)'
    }
  },
  data: function () {
    return {
      hover: false
    }
  },
  computed: {
    style: function () {
      return {
        color: this.hover ? this.hoverColor : this.color,
        backgroundColor: this.hover ? this.hoverBackgroundColor : this.backgroundColor
      }
    }
  }
})
</script>

<style scoped>
.material-icons.button {
  cursor: pointer;
  font-size: 18px;
  border-radius: 4px;
}
.material-icons.button[disabled] {
  cursor: default;
  color: #ccc;
}
.material-icons.button:hover:not([disabled]) {
}
</style>
