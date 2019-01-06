<template>
  <div name="footer" class="flexrow">
      <span id="version">version {{cfg.VERSION}}</span>
    <span>MGV is powered by:
    <a href="http://www.informatics.jax.org" target="_blank">MGI</a>,
    <a href="http://www.mousemine.org" target="_blank">MouseMine</a>,
    <a href="https://vuejs.org/" target="_blank">Vue.js</a>,
    <a href="https://material.io/icons/" target="_blank">Material Icons</a>
    </span>
    <span><a tabindex="-1" href="https://github.com/JoelRichardson/mgv">MGV@GitHub</a></span>
  </div>

</template>

<script>
import MComponent from '@/components/MComponent'
export default MComponent({
  name: 'MFooter',
  props: ['version']
})
</script>

<style scoped>
[name="footer"] {
  padding-left: 12px;
  padding-top: 0px;
  padding-bottom: 0px;
  background-color: #557f9e;
  color: white;
  font-size: 12px;
  font-weight: bold;
  position: fixed;
  left: 0px;
  bottom: 0px;
  width: 99%;
}
a:link, a:visited {
  color: white;
  text-decoration: none;
}
a:hover {
  color: yellow;
}
</style>
