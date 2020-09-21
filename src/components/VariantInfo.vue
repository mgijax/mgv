<template>
    <div
      class="variant-info flexcolumn"
      v-if="isOpen && variant"
      :style="{ top: y + 'px', left: x + 'px', zIndex : 100, fontSize: '12px' }"
      @click.stop=""
      >
        <m-button
          icon="highlight_off"
          title="Close this contol."
          style="position: absolute; top: 0px; right: 0px; font-size: 10px;"
          @click="close"
          />
        <div>
        <table
          >
          <tr>
            <td colspan=2> {{ variant.ID }} </td>
            </tr>
          <tr>
            <td>Type:</td>
            <td>{{ variant.so_term }}</td>
            </tr>
          <tr>
            <td>Consequence:</td>
            <td>{{ variant.glConsequence.replaceAll("|", " ") }}</td>
            </tr>
          <tr>
            <td>Impact:</td>
            <td>{{ variant.glImpact.replaceAll("|", " ") }}</td>
            </tr>
          <tr>
            <td>Ref seq:</td>
            <td>{{ variant.ref }}</td>
            </tr>
          <tr>
            <td>Alt seq:</td>
            <td>{{ variant.alt }}</td>
            </tr>  
          <tr v-if="variant.tlEffects && variant.tlEffects.length > 0">
            <td colspan=2>
              <table>
                <tr><td colspan=3>Transcript level effects</td></tr>
                <tr
                v-for="tl in variant.tlEffects"
                :key="tl.ID"
                >
                  <td>{{tl.ID}}</td>
                  <td>{{tl.consequence.replaceAll("|", " ")}}</td>
                  <td>{{tl.impact.replaceAll("|", " ")}}</td>
                  </tr>
                </table>
            </td>
            </tr>

          </table>
          </div>


    </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
export default MComponent({
  name: 'VariantInfo',
  components: { MButton },
  data: function () {
    return {
      isOpen: false,
      x: 0,
      y: 0,
      variant: null
    }
  },
  methods: {
    open (obj, y, x) {
      this.variant = obj
      this.x = x
      this.y = y
      this.isOpen = true
    },
    close () {
      this.isOpen = false
    },
  },
  mounted: function () {
    // close me if user clicks on background
    this.$root.$el.addEventListener('click', () => this.close())
  }
})
</script>

<style scoped>
.variant-info {
  position: fixed;
  background-color: rgba(255,255,255,1);
  border-radius: 4px;
  border: thin solid gray;
}
.variant-info > div {
  max-width: 500px;
  max-height: 300px;
  overflow: scroll;
}
.variant-info td {
  text-align: start;
  vertical-align: top;
}
</style>
