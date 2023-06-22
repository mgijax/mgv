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

import MComponent from './MComponent.js'
import u          from '../lib/utils.js'
import Emitter    from 'tiny-emitter'

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
      let cbs = u.getBBoxes(this.children, 'y')
      let state = cbs.map(cb => {
        return { label: cb.component.label, isOpen: cb.component.isOpen, floating: cb.component.floating }
      })
      return state
    },
    // Sets the Y order and open/closed state of my children.
    // Args:
    //   List of child state descriptors in the form returned by getChildState
    // Returns:
    //   Nothing
    setChildState: function (state) {
      let p = this.$el
      state.forEach(cs => {
        let child = this.children.filter(c => c.label === cs.label)[0]
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
  created: function () {
      // create the bus for event traffic with kids
      this.ebus = new Emitter()
      //
      this.children = []
  },
  mounted: function () {
    //
    this.ebus.on('pagebox-open', pb => {
      if (this.layout === "accordian" && !pb.floating) {
        this.accordianOpen(pb.label)
      } else {
        this.saveChildState()
      }
    })
    this.ebus.on('pagebox-close', () => this.saveChildState())
    
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
