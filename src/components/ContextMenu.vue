<template>
  <m-menu 
    :menuItems="menuItems"
    />
</template>

<script>
import MComponent from './MComponent.js'
import MMenu from './MMenu.vue'
export default MComponent({
  name: 'ContextMenu',
  components: { MMenu },
  props: ['menuItems']
})
</script>

<style scoped>
</style>
