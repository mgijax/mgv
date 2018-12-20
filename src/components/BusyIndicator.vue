<template>
  <g v-if="svg" class="busy-indicator">
    <text x="50%" y="50%" class="material-icons rotating">settings</text>
  </g>
  <div v-else class="busy-indicator" >
    <i class="material-icons rotating">settings</i>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
export default MComponent({
  name: 'BusyIndicator',
  props: ['svg']
})
</script>

<style scoped>
.busy-indicator {
  width: 100%;
  height: 100%;
  background-color: gray;
  z-index: 100;
  opacity: 0.8;
  position: absolute;
  top: 0px;
  left: 0px;
}
.busy-indicator .rotating {
  position: absolute;
  left: 50%;
  top: 50%;
}
g.busy-indicator text {
  fill: black;
  stroke: none;
  text-anchor: middle;
}
</style>
