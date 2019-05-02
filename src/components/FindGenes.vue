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
      size=30
      :placeholder="currentSelection.placeholder"
      @blur="doSearch($event.target)"
      @keypress="blurOnEnter"
      />
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MouseMineQueries from '@/lib/MouseMineQueries'

export default MComponent({
  name: 'FindGenes',
  data: function () {
    return {
      searches: (new MouseMineQueries()).getQueries(),
      currentSelection: { label: '' }
    }
  },
  methods: {
    selectSearch: function (val) {
      this.currentSelection = this.searches.filter(s => s.label === val)[0]
    },
    tellBusy (bool) {
      this.$parent.isBusy = bool
    },
    doSearch (inp) {
      let s = inp.value
      s = s.trim()
      if (!s) return
      let cs = this.currentSelection
      this.tellBusy(true)
      cs.handler && cs.handler(s).then(data => {
        this.$root.$emit('query-returned', { queryType: this.currentSelection, query: s, results: data })
        inp.value = ''
        this.tellBusy(false)
      }).catch(err => {
        this.tellBusy(false)
      })
    },
    blurOnEnter (e) {
      if (e.keyCode === 13) e.target.blur()
    }
  },
  mounted: function () {
    this.currentSelection = this.searches[0]
  }

})
</script>

<style scoped>
</style>
