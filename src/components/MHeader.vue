<template>
  <div name="header" class="flexrow">
    <m-button
      name="settingBtn"
      @click="$emit('gear-clicked')"
      icon="settings"
      title="Show/hide left column."
      color="white"
      hoverColor="rgb(31, 119, 180)"
      hoverBackgroundColor="white"
      />
    <img
      name="mgiLogo"
      title="Mouse Genome Informatics"
      class="logo"
      src="../assets/MGI_logo.png"
      />
    <span
      name="title"
      >Multiple Genome Viewer (MGV)</span>
    <img
      name="mousemineLogo"
      title="MouseMine"
      class="logo"
      src="../assets/MouseMine_logo.png"
      />
    <m-button
      name="infoBtn"
      icon="info"
      @click="openHelp"
      color="white"
      hoverColor="rgb(31, 119, 180)"
      hoverBackgroundColor="white"
      />
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
export default MComponent({
  name: 'MHeader',
  components: { MButton },
  methods: {
    openHelp () {
      window.open('http://www.informatics.jax.org/userhelp/MGV_help.shtml', '_blank')
    }
  }
})
</script>

<style scoped>
[name="header"] {
  padding: 12px;
  background-color: #557f9e;
  color: white;
}
img.logo {
  height: 40px;
}
[name="header"] .button {
    font-size: 24px !important;
}
[name="title"] {
    font-size: 16px;
    font-weight: bold;
}
[name="settingBtn"].fixed {
  position: fixed;
  top: 10px;
  z-index: 100;
}
</style>
