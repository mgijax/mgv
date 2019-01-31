<template>
  <div
    class="menu-item flexrow"
    :class="{ topLevel: topLevel, disabled: isDisabled }"
    @click.stop="clicked"
    :title="helpText"
    >
    <span
      v-if="label"
      >{{label}}</span>
    <i
      class="material-icons"
      >{{cicon}}</i>
    <m-menu
      v-if="menuItems"
      :menuItems="menuItems"
      ref="subMenu"
      @menu-item-selected="$emit('menu-item-selected')"
      :contextObject="contextObject"
      />
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import MMenu from '@/components/MMenu'
export default MComponent({
  name: 'MMenuItem',
  props: {
    icon: {
      type: String
    },
    label: {
      type: String
    },
    helpText: {
      type: String,
      default: ''
    },
    handler: {
      type: Function
    },
    menuItems: {
      type: Array
    },
    contextObject: {
      type: Object
    },
    topLevel: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: [Boolean, Function],
      default: false
    }
  },
  components: { MButton, MMenu },
  computed: {
    cicon: function () {
      return this.icon || (this.menuItems ? 'keyboard_arrow_right' : '')
    },
    isDisabled: function () {
      if (typeof(this.disabled) === 'function') return this.disabled(this.contextObject)
      return this.disabled
    }
  },
  methods: {
    clicked: function () {
      if (this.isDisabled) return
      if (this.handler) this.handler(this.contextObject)
      if (this.$refs.subMenu) {
        this.$refs.subMenu.toggle()
      } else {
        this.$emit('menu-item-selected')
      }
    }
  }
})
</script>

<style scoped>
.menu-item {
  cursor: pointer;
  white-space: nowrap;
}
.menu-item.disabled {
  color: lightgray;
}
.menu-item.topLevel {
  flex-grow: 0;
}
.menu-item > * {
  padding: 4px;
}
.menu-item:not(.topLevel):not(.disabled):hover {
  background-color: #ccc;
}
.transparent {
  opacity: 0;
}
</style>
