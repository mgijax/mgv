<template>
    <div
      class="variant-info flexcolumn"
      v-show="isOpen && variant"
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
          v-if="variant"
          >
          <tr>
            <td class="label">HGVS:</td>
            <td> {{ variant.ID }} </td>
            </tr>
          <tr>
            <td class="label">Type:</td>
            <td>{{ variant.so_term }}</td>
            </tr>
          <tr>
            <td class="label">Ref seq:</td>
            <td>{{ variant.ref }}</td>
            </tr>
          <tr>
            <td class="label">Alt seq:</td>
            <td>{{ variant.alt }}</td>
            </tr>  
          <tr v-if="variant.aEffects && variant.aEffects.length > 0">
            <td colspan=2>
              <label>Alleles</label>
              <table>
                <tr
                v-for="a in variant.aEffects"
                :key="a.curie"
                >
                  <td>{{a.symbolText}}</td>
                  <td><a
                      :href="'https://www.alliancegenome.org/allele/' + a.curie"
                      target="_blank"
                      >{{a.curie}}</a></td>
                  </tr>
                </table>
            </td>
            </tr>
          <tr v-if="variant.gEffects && variant.gEffects.length > 0">
            <td colspan=2>
              <label>Gene level effects</label>
              <table>
                <tr
                v-for="g in variant.gEffects"
                :key="g.curie"
                >
                  <td>{{g.symbol}}</td>
                  <td><a
                      :href="'https://www.alliancegenome.org/gene/' + g.curie"
                      target="_blank"
                      >{{g.curie}}</a></td>
                  <td>{{g.impact}}</td>
                  <td>{{(g.consequence || []).join(' ')}}</td>
                  </tr>
                </table>
            </td>
            </tr>
          <tr v-if="variant.tEffects && variant.tEffects.length > 0">
            <td colspan=2>
              <label>Transcript level effects</label>
              <table>
                <tr
                v-for="t in variant.tEffects"
                :key="t.ID"
                >
                  <td>{{t.curie}}</td>
                  <td>{{t.impact}}</td>
                  <td>{{(t.consequence || []).join(' ')}}</td>
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
  },
  updated: function () {
    const bb = this.$el.getBoundingClientRect()
    const dx = Math.max(0, bb.left + bb.width - window.innerWidth)
    const dy = Math.max(0, bb.top + bb.height - window.innerHeight)
    this.y -= dy
    this.x -= dx
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
.variant-info table {
  table-layout: auto;
}
td.label {
  font-weight: bold;
}
label {
  font-weight: bold;
}
</style>
