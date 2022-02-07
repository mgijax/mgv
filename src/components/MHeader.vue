<template>
  <div name="header" class="flexcolumn"
    :style="cfg.style"
    >
    <div class="flexrow">
      <m-button
        name="settingBtn"
        @click="$emit('gear-clicked')"
        icon="settings"
        title="Show/hide tool drawer."
        :color="cfg.style.color"
        hoverColor="rgb(31, 119, 180)"
        hoverBackgroundColor="white"
        />
      <img
        name="allianceLogo"
        title="Alliance of Genome Resources"
        class="logo"
        :src="cfg.logoLeft"
        />
      <span
        name="title"
        >{{cfg.title}}</span>
      <img
        name="allianceLogo"
        title="Alliance of Genome Resources"
        class="logo"
        :src="cfg.logoRight"
        />
      <m-button
        name="infoBtn"
        title="Click for help."
        icon="help"
        @click="openHelp"
        :color="cfg.style.color"
        hoverColor="rgb(31, 119, 180)"
        hoverBackgroundColor="white"
        />
    </div>
    <m-status ref="status" name="status"/>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import MStatus from '@/components/MStatus'
export default MComponent({
  name: 'MHeader',
  components: { MButton, MStatus },
  methods: {
    openHelp () {
      this.app.$refs.helpBox.toggleOpen()
    }
  }
})
</script>

<style scoped>
[name="header"] {
  width: 100%;
  height: 60px;
}
[name="header"] > * {
  margin-left: 16px;
  margin-right: 16px;
}
[name="status"] {
  position: absolute;
  top: 60px;
  margin: 0px;
  z-index: 200;
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
