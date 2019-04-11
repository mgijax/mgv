<template>
  <div
    :name="name"
    class="page-box-container"
    @dragover="dragOver"
    @drop="drop"
    >
      <slot></slot>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import u from '@/lib/utils'
export default MComponent({
  name: 'PageBoxContainer',
  inject: ['preferencesManager'],
  props: {
    name: String,
    layout: String // one of "default", "accordian"
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
        return { label: k.c.label, isOpen: k.c.isOpen, floating: k.c.floating }
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
        if (child) {
          child[cs.isOpen ? 'open' : 'close']()
          p.appendChild(child.$el)
        }
      })
      this.saveChildState()
    },
    //
    accordianOpen (child) {
      this.setChildState(this.getChildState().map(cs => {
        cs.isOpen = cs.floating ? cs.isOpen : (cs === child || cs.label === child)
        return cs
      }))
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
    this.$children.forEach(c => { 
      c.$on('pagebox-open', pb => {
        if (this.layout === "accordian" && !pb.floating) {
          this.accordianOpen(pb.label)
        } else {
          this.saveChildState()
        }
      })
      c.$on('pagebox-close', () => this.saveChildState())
    })
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
