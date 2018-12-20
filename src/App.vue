<template>
  <div id="app">
    <MGV />
  </div>
</template>

<script>
import MGV from './components/MGV.vue'

export default {
  name: 'app',
  components: {
    MGV
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
