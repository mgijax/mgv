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
export default MComponent({
  name: 'FindGenes',
  data: function () {
    return {
      currentSelection: { label: '' }
    }
  },
  computed: {
    searches: function () {
      return this.dataManager.getQueries()
    }
  },
  methods: {
    selectSearch: function (val) {
      this.currentSelection = this.searches.filter(s => s.label === val)[0]
    },
    doSearch (inp) {
      let s = inp.value
      s = s.trim()
      if (!s) return
      let cs = this.currentSelection
      cs.handler && cs.handler(s).then(data => {
        this.$root.$emit('query-returned', { queryType: this.currentSelection, query: s, results: data })
        inp.value = ''
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
