<template>
  <div id="app">
    <MGV ref="mgv"/>
  </div>
</template>

<script>
//import MGV from './components/MGV2.vue'
import MGV from './components/MGV.vue'
import u   from './lib/utils'


export default {
  name: 'app',
  components: {
    MGV
  },
  props: {
    runtimeConfig: "object", // contents of runtimeConfig.json file
    ebus: "object"  // the event bus
  },
  mounted: function () {
      console.log(this)
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
