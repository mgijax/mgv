<template>
    <div
      class="m-menu"
      v-show="isOpen"
      :class="`flex${orientation}`"
      :style="style"
      @click.stop=""
      >
      <div
        v-if="title"
        name="title"
        >
        <div v-if="typeof(title) === 'string'"
          >{{ title }}</div>
        <div v-if="Array.isArray(title)">
          <div
            v-for="(tline, i) in title"
            :key="i"
            :class="{ subtitle: i > 0 }"
            >{{tline}}</div>
        </div>
      </div>
      <m-button
        v-if="closeButton"
        icon="close"
        name="closeBtn"
        @click.stop="close()"
        />
      <m-menu-item
        v-for="(mi,i) in menuItems"
        :key="i"
        :label="mi.label"
        :icon="mi.icon"
        :helpText="mi.helpText"
        :handler="mi.handler"
        :contextObject="contextObject"
        :extraArgs="mi.extraArgs"
        :menuItems="mi.menuItems"
        :disabled="mi.disabled || null"
        @menu-item-selected="menuItemSelected"
        />
    </div>
</template>

<script>
import MComponent from './MComponent.js'
import MButton    from './MButton.vue'
//import MMenuItem  from './MMenuItem.vue'
import { defineAsyncComponent } from 'vue'
export default MComponent({
  name: 'MMenu',
  props: {
    menuItems: {
      type: Array,
      required: true
    },
    title: {
      type: [String, Array],
      default: ''
    },
    initialOpen: {
      type: Boolean,
      default: false
    },
    closeButton: {
      type: Boolean,
      default: false
    },
    orientation: {
      type: String,
      default: 'column',
      validator: function (value) {
        return ['row', 'column'].indexOf(value) !== -1
      }
    },
    contextObject: {
      type: Object
    }
  },
  components: {
    // Because MMenu and MMenuItem are mutually recursive, we cannot import the usual way
    MMenuItem: defineAsyncComponent(() => import('./MMenuItem.vue')),
    MButton
  },
  data: function () {
    return {
      isOpen: this.initialOpen,
      top: '50%',
      left: '50%'
    }
  },
  computed: {
    style: function () {
      let s = (x) => ((typeof x === 'string') ? x : `${x}px`)
      return {
        top: s(this.top),
        left: s(this.left)
      }
    }
  },
  methods: {
    open: function (top, left) {
      if (top !== undefined) this.top = top
      if (left !== undefined) this.left = left
      this.isOpen = true
    },
    close: function () {
      this.isOpen = false
    },
    toggle: function () {
      this.isOpen = !this.isOpen
    },
    menuItemSelected: function () {
      this.close()
      this.$emit('menu-item-selected')
    }
  },
  mounted: function () {
    // close me if user clicks on background
    document.body.addEventListener('click', () => this.close())
  },
  updated: function () {
    const bb = this.$el.getBoundingClientRect()
    const dx = Math.max(0, bb.left + bb.width - window.innerWidth)
    const dy = Math.max(0, bb.top + bb.height - window.innerHeight)
    this.top -= dy
    this.left -= dx
  }
})
</script>

<style scoped>
.m-menu {
  position: fixed;
  background-color: #eee;
  z-index: 200;
  padding: 4px;
  border: thin solid #8c8c8c;
  border-radius: 4px;
}
.m-menu [name="title"] {
  font-weight: bold
}
.m-menu [name="title"] .subtitle {
  font-weight: normal;
  font-size: 10px;
}
[name="closeBtn"] {
  position: absolute;
  top: 3px;
  right: 3px;
}
</style>
