<template>
  <div class="find-genes flexcolumn">
    <select
      @change="selectSearch($event.target.value)"
      >
      <option
        v-for="search in searches"
        :key="search.label"
        :value="search.label"
        >{{search.label}}</option>
    </select>
    <input
      ref="searchTerm"
      size=30
      :placeholder="selection.placeholder"
      @keypress="submitOnEnter"
      />
    <span
       class="help-text"
       v-html="selection.helpText"
       ></span>
  </div>
</template>

<script>
import MComponent from './MComponent.js'
import MouseMineQueries from '../lib/MouseMineQueries.js'

export default MComponent({
  name: 'FindGenes',
  data: function () {
    return {
      searches: (new MouseMineQueries()).getQueries(),
      selection: { label: '' }
    }
  },
  methods: {
    selectSearch: function (val) {
      this.selection = this.searches.filter(s => s.label === val)[0]
    },
    tellBusy (bool) {
      this.$parent.$parent.isBusy = bool
    },
    doSearch () {
      let s = this.$refs.searchTerm.value
      s = s.trim()
      if (!s) return
      let cs = this.selection
      this.tellBusy(true)
      cs.handler && cs.handler(s).then(data => {
        this.$root.ebus.emit('query-returned', { queryType: this.selection, query: s, results: data })
	this.$refs.searchTerm.value = ''
        this.tellBusy(false)
      }).catch(() => {
        this.tellBusy(false)
      })
    },
    submitOnEnter (e) {
      if (e.keyCode === 13) this.doSearch()
    }
  },
  mounted: function () {
    this.selection = this.searches[0]
  }

})
</script>

<style scoped>
.help-text {
    font-size: 10px;
}
</style>
