<template>
  <div class="help-box">
    <!-- top part does not scroll -->
    <span class="title">MGV Help</span>
    <div class="top-part">
      <!-- a button per section -->
      <span
        v-for="(s,i) in sections"
        class="sectionButton"
        :class="{ current: selectedSection === i }"
        @click="selectedSection = i"
        >{{s.name}}</span>
    </div>
    <!-- bottom part scrolls -->
    <div class="bottom-part" :class="currSection.name">
      <div
        v-if="currSection.description"
        v-html="currSection.description"
        />
      <table>
        <tr v-for="(r,ri) in currSection.items" class="itemrow">
          <td width="25%" class="what" v-html="r.what"></td>
          <td class="how" v-html="r.how"></td>
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
import helpData from '@/components/HelpBoxData'
export default MComponent({
    name: 'HelpBox',
    inject: ['preferencesManager'],
    data: function () {
      console.log(helpData)
      return {
        selectedSection: 0,
        sections: helpData,
     }
   },
   computed: {
     currSection: function () {
       return this.sections[this.selectedSection]
     }
   },
   mounted: function () {
     this.preferencesManager().getPrefs('settings').then(settings => {
       if (settings.HelpBox.showOnStartup) {
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
}
.help-box .title {
  font-size: 18px;
}
.help-box .top-part {
  padding-right: 50px;
}
.help-box .bottom-part {
  max-height: 500px;
  overflow: scroll;
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
.help-box .how .material-icons {
  font-size: 16px;
  font-weight: bold;
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
