<template>
  <i
    class="m-button"
    :class="{ 'material-icons' : isMaterialIcon, 'other-icon' : !isMaterialIcon }"
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
      const isDisabled = this.$el && this.$el.getAttribute('disabled')
      return {
        color: this.hover && !isDisabled ? this.hoverColor : this.color,
        backgroundColor: this.hover && !isDisabled ? this.hoverBackgroundColor : this.backgroundColor
      }
    },
    isMaterialIcon: function () {
      let fc = this.icon.charAt(0)
      return fc >= 'a' && fc <= 'z'
    }
  }
})
</script>

<style scoped>
.m-button {
  cursor: pointer;
  font-size: 18px;
  border-radius: 4px;
}
.m-button[disabled] {
  cursor: default;
  opacity: 0.5;
}
.other-icon {
  font-style: normal;
}
</style>
