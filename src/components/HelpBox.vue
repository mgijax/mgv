<template>
  <div class="help-box" :class="{ 'help-collapsed' : collapsed }">
    <!-- top part does not scroll -->
    <div class="top-part">
      <!-- a button per section -->
      <span
        v-for="(s,i) in sections"
        class="sectionButton"
        :class="{ current: selectedSection === i }"
        @click="select(i)"
        >{{s.name}}</span>
      <m-button
        class="collapse-btn"
        @click="collapsed = !collapsed"
        :icon="collapsed ? 'arrow_drop_down' : 'arrow_drop_up'"
        />
    </div>
    <!-- bottom part scrolls -->
    <div class="bottom-part" :class="currSection.name">
      <div
        v-if="currSection.description"
        v-html="currSection.description"
        />
      <table>
        <tr v-for="(r,ri) in currSection.items" class="itemrow">
          <td v-if="r.heading" colspan="2" class="heading" v-html="r.heading"></td>
          <td v-if="r.label" width="25%" class="what" v-html="r.label"></td>
          <td v-if="r.label" class="how" v-html="r.text"></td>
        </tr>
      </table>
    </div>
    <div class="footer">
      <input type="checkbox" v-model="app.$refs.settings.HelpBox.showOnStartup" />Show Help on startup.
    </div>

  </div>
</template>

<script>
import config from '@/config'
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import helpData from '@/components/HelpBoxData'
export default MComponent({
    name: 'HelpBox',
    inject: ['preferencesManager'],
    components: { MButton },
    data: function () {
      return {
        selectedSection: 0,
        sections: helpData,
        collapsed: false
     }
   },
   methods: {
     select: function (i) {
       this.collapsed = false
       this.selectedSection = i
     }
   },
   computed: {
     currSection: function () {
       return this.sections[this.selectedSection]
     }
   },
   mounted: function () {
     this.preferencesManager().getPrefs('settings').then(settings => {
       if (!settings || settings.HelpBox.showOnStartup) {
         this.$parent.open()
       }
     })
   }
})

</script>

<style>
.help-box {
  width: 450px;
  text-align: left;
  position: relative;
}
.help-box .title {
  font-weight: bold;
  font-size: 18px;
}
.help-box .top-part {
  padding-right: 50px;
}
.help-box .bottom-part {
  max-height: 500px;
  overflow: scroll;
}
.help-box.help-collapsed .bottom-part,
.help-box.help-collapsed .footer {
  display: none;
}
.help-box .collapse-btn {
  position: absolute;
  right: 10px;
  top: 0px;
}
.help-box td {
  padding-bottom: 10px;
}
.help-box .bottom-part.Shortcuts td {
  padding-bottom: 0px;
}
.help-box .what {
  font-weight: bold;
  vertical-align: top;
}
.help-box .bottom-part.Shortcuts .what {
  text-align: center;
}
.help-box .bottom-part .material-icons {
  font-size: 16px;
}
.help-box .sectionButton {
  cursor: pointer;
  border: thin solid black;
  border-radius: 4px;
  margin-right: 4px;
  margin-bottom: 4px;
  padding: 2px;
  display: inline-block;
}
.help-box .sectionButton:hover {
  background-color: white;
}
.help-box .sectionButton.current {
  background-color: #557f9e;
  color: white;
}
.help-box .footer {
  margin-top: 10px;
}
</style>
