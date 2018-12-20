<template>
  <div
    :name="name"
    class="page-box-container"
    :style="{ top: topOffset + 'px' }"
    @dragover="dragOver"
    @drop="drop"
    >
      <slot></slot>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
export default MComponent({
  name: 'PageBoxContainer',
  inject: ['preferencesManager'],
  props: ['name', 'fixed'],
  data: function () {
    return {
      topOffset: 0
    }
  },
  computed: {
    storeName: function () {
      return this.name + '.pageBoxes'
    }
  },
  methods: {
    dragOver: function (ev) {
      ev.preventDefault()
    },
    drop: function (ev) {
      ev.preventDefault()
      this.setChildState(this.getChildState())
    },
    // Returns the current state of this container's PageBox children.
    // State comprises child y-order (top-to-bottom) and whether each
    // box is open or closed.
    // Args:
    //   none
    // Returns:
    //   A list of the form: [{ label, isOpen }]
    getChildState: function () {
      let kids = this.$children.map(c => {
        let y = c.$el.getBoundingClientRect().y
        return { c, y }
      })
      kids.sort((a, b) => a.y - b.y)
      return kids.map(k => {
        return { label: k.c.label, isOpen: k.c.isOpen }
      })
    },
    // Sets the Y order and open/closed state of my children.
    // Args:
    //   List of child state descriptors in the form returned by getChildState
    // Returns:
    //   Nothing
    setChildState: function (state) {
      let p = this.$el
      state.forEach(cs => {
        let child = this.$refs[cs.label]
        child[cs.isOpen ? 'open' : 'close']()
        p.appendChild(child.$el)
      })
      this.saveChildState()
    },
    // Sets child state from the last saved preferences
    setChildStateFromSaved: function () {
      this.preferencesManager().getPrefs(this.storeName).then(state => {
        if (state) {
          this.setChildState(state)
        }
      })
    },
    // Save current child state to storage
    saveChildState: function () {
      this.preferencesManager().setPrefs(this.storeName, this.getChildState())
    }
  },
  mounted: function () {
    //
    if (this.fixed) {
      document.addEventListener('scroll', () => {
        let bcr = this.$el.parentNode.getBoundingClientRect()
        if (bcr.y < 0) {
          this.topOffset = -bcr.y
        } else {
          this.topOffset = 0
        }
      })
    }
    //
    this.$root.$on('pagebox-open', () => this.saveChildState())
    this.$root.$on('pagebox-close', () => this.saveChildState())
    this.preferencesManager().getPrefs(this.storeName).then(prefs => {
      if (prefs) {
        this.setChildState(prefs)
      }
    })
  }
})
</script>

<style scoped>
</style>
