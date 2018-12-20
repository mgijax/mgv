<template>
    <div
      class="m-menu"
      v-show="isOpen"
      :class="`flex${orientation}`"
      :style="style"
      >
      <span
        v-if="title"
        name="title"
        >
        {{ title }}
        </span>
      <m-menu-item
        v-for="(mi,i) in menuItems"
        :key="i"
        :label="mi.label"
        :icon="mi.icon"
        :helpText="mi.helpText"
        :handler="mi.handler"
        :itemData="mi.data"
        :menuItems="mi.menuItems"
        :disabled="mi.disabled"
        @menu-item-selected="menuItemSelected"
        />
    </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
// Because MMenu and MMenuItem are mutually recursive, we cannot import the usual way
// import MMenuItem from '@/components/MMenuItem'
export default MComponent({
  name: 'MMenu',
  props: {
    menuItems: {
      type: Array,
      required: true
    },
    title: {
      type: String,
      default: ''
    },
    initialOpen: {
      type: Boolean,
      default: false
    },
    orientation: {
      type: String,
      default: 'column',
      validator: function (value) {
        return ['row', 'column'].indexOf(value) !== -1
      }
    }
  },
  components: {
    // Because MMenu and MMenuItem are mutually recursive, we cannot import the usual way
    MMenuItem: () => import('@/components/MMenuItem'),
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
    this.$root.$el.addEventListener('click', () => this.close())
  }
})
</script>

<style scoped>
.m-menu {
  position: absolute;
  background-color: #eee;
  z-index: 100;
  padding: 4px;
  border: thin solid #8c8c8c;
  border-radius: 4px;
}
.m-menu [name="title"] {
  font-weight: bold
}
</style>
