<template>
  <div name="header" class="flexrow">
    <m-button
      name="settingBtn"
      @click="$emit('gear-clicked')"
      icon="settings"
      title="Show/hide tool drawer."
      color="white"
      hoverColor="rgb(31, 119, 180)"
      hoverBackgroundColor="white"
      />
    <img
      name="allianceLogo"
      title="Alliance of Genome Resources"
      class="logo"
      src="../assets/Alliance_logo.png"
      />
    <!--
    <img
      name="mgiLogo"
      title="Mouse Genome Informatics"
      class="logo"
      src="../assets/MGI_logo.png"
      />
    -->
    <span
      name="title"
      >Multiple Genome Viewer (MGV)</span>
    <img
      name="allianceLogo"
      title="Alliance of Genome Resources"
      class="logo"
      src="../assets/Alliance_logo.png"
      />
    <!--
    <img
      name="mousemineLogo"
      title="MouseMine"
      class="logo"
      src="../assets/MouseMine_logo.png"
      />
    -->
    <m-button
      name="infoBtn"
      title="Click for help."
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
      this.app.$refs.helpBox.toggleOpen()
    }
  }
})
</script>

<style scoped>
[name="header"] {
  color: white;
  background-color: #557f9e;
  width: 100%;
  height: 60px;
}
[name="header"] > * {
  margin-left: 16px;
  margin-right: 16px;
}
img.logo {
  height: 40px;
}
[name="header"] .button {
    font-size: 24px !important;
}
[name="title"] {
    font-size: 26px;
    font-weight: bold;
}
[name="settingBtn"].fixed {
  position: fixed;
  top: 10px;
  z-index: 100;
}
</style>
