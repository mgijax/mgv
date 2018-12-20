<template>
  <m-menu-item class="tool-bar-menu"
    :icon="icon"
    :label='label'
    :menuItems="menuItems"
    :topLevel="true"
    />
</template>

<script>
import MComponent from '@/components/MComponent'
import MMenuItem from '@/components/MMenuItem'
export default MComponent({
  name: 'ToolbarMenu',
  components: { MMenuItem },
  props: ['icon', 'label', 'menuItems']
})
</script>

<style scoped>
</style>
