<template>
  <m-menu 
    :menuItems="menuItems"
    />
</template>

<script>
import MComponent from '@/components/MComponent'
import MMenu from '@/components/MMenu'
export default MComponent({
  name: 'ContextMenu',
  components: { MMenu },
  props: ['menuItems']
})
</script>

<style scoped>
</style>
