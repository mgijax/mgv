<template>
  <div
    class="menu-item flexrow"
    :class="{ topLevel: topLevel, disabled: getValue('disabled'), separator: isSeparator }"
    @click.stop="clicked"
    @mouseenter="mouseenter"
    @mouseleave="mouseleave"
    :title="getValue('helpText')"
    >
    <span
      v-if="label"
      v-html="getValue('label')"
      ></span>
    <i
      class="material-icons"
      >{{cicon}}</i>
    <m-menu
      v-if="menuItems"
      :menuItems="getValue('menuItems')"
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
      type: [String, Function],
      default: ''
    },
    helpText: {
      type: [String, Function],
      default: ''
    },
    handler: {
      type: Function
    },
    menuItems: {
      type: [Array, Function],
    },
    contextObject: {
      // if this is an item in a context menu, the content object (e.g., the feature)
      // 1st arg to handler
      type: Object
    },
    extraArgs: {
      type: Array,
      default: function () { return []}
      // 2nd arg to handler
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
    isSeparator: function () {
      return !this.handler && !this.menuItems
    }
  },
  methods: {
    getValue: function (n) {
      if (typeof(this[n]) === 'function') return this[n](this.contextObject)
      return this[n]
    },
    mouseenter: function () {
      if (this.$refs.subMenu) {
        const bb = this.$el.getBoundingClientRect()
        this.$refs.subMenu.open(bb.top + 0.5 * bb.height, bb.left + 0.5 * bb.width)
      }
    },
    mouseleave: function () {
      if (this.$refs.subMenu) {
        this.$refs.subMenu.close()
      }
    },
    clicked: function () {
      if (this.isDisabled) return
      if (this.handler) this.handler(this.contextObject, ...this.extraArgs)
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
.menu-item.separator {
    border-top: thin solid white;
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
.menu-item:not(.topLevel):not(.disabled):not(.separator):hover {
  background-color: #ccc;
}
.transparent {
  opacity: 0;
}
</style>
