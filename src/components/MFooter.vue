<template>
  <div name="footer" class="flexrow"
    :style="style"
    >
    <span id="version">version {{cfg.VERSION}}</span>
    <span>MGV is powered by:
    <a href="http://www.informatics.jax.org" target="_blank">MGI</a>,
    <a href="https://www.mousemine.org" target="_blank">MouseMine</a>,
    <a href="https://vuejs.org/" target="_blank">Vue.js</a>,
    <a href="https://material.io/tools/icons/" target="_blank">Material Icons</a>
    </span>
    <span v-if="app.debug">{{usageString}}</span>
    <span><a tabindex="-1" target="_blank" href="https://github.com/mgijax/mgv">MGV@GitHub</a></span>
  </div>

</template>

<script>
import MComponent from '@/components/MComponent'
import config from '@/config'
export default MComponent({
  name: 'MFooter',
  props: ['version'],
  data: function () {
    return {
      style: config.MHeader.style
    }
  },
  computed: {
    usageString: function () {
        const wpm = window.performance.memory
        const mem = wpm ? '/ ' + (wpm.usedJSHeapSize/1000000).toFixed(1) + ' MB' : ''
        const obj = this.app.objectsInMemory + ' objects'
        return `${obj} ${mem}`
    }
  }
})
</script>

<style scoped>
[name="footer"] {
  height: 20px;
  width: 100%;
  font-size: 12px;
  font-weight: bold;
}
a:link, a:visited {
  color: inherit;
  text-decoration: none;
}
a:hover {
  color: yellow;
}
</style>
