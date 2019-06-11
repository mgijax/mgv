<template>
    <div
      class="zoom-region-controls flexcolumn"
      v-show="isOpen"
      :style="{ top: y + 'px', left: x + 'px' }"
      @click.stop=""
      >
      <div class = "flexrow">
        <!-- drag handle -->
        <i
          ref="dragHandle"
          class="material-icons"
          style="font-size: 14px; color: gray; cursor: grab;"
          >drag_indicator</i>
        <!-- genome name -->
        <span style="font-size: 12px">{{region ? region.genome.name : ''}}</span>
        <!-- coordinates box -->
        <input
          size="24"
          v-model="formattedCoords"
          title="Enter coordinates (chr:start..end) or feature symbol or ID."
          @change="setCoords"
          />
        <!-- close -->
        <m-button
          icon="highlight_off"
          title="Close this contol."
          style="position: absolute; top: -5px; right: -5px; font-size: 10px;"
          @click="close"
          />
      </div>
      <div class="row2 flexrow">
        <!-- div v-if="region && region.genome.name === 'C57BL/6J'" -->
        <div class="mgibuttons" v-show="region && region.genome.name === 'C57BL/6J'">
          <label>MGI</label>
          <!-- SNPs linkout -->
          <m-button
            icon="SNPs"
            title="See SNPs at MGI in this region of B6 vs other displayed genomes."
            @click="mgiSNPquery"
            :disabled="region && region.genome.name !== 'C57BL/6J'"
            />
          <!-- QTL linkout -->
          <m-button
            icon="QTL"
            title="See QTL at MGI in this region."
            @click="mgiQTLquery"
            :disabled="region && region.genome.name !== 'C57BL/6J'"
            />
          <!-- JBrowse linkout -->
          <m-button
            icon="JBrowse"
            title="See the full details of this region in the MGI JBrowse genome browser."
            @click="mgiJBquery"
            :disabled="region && region.genome.name !== 'C57BL/6J'"
            />
        </div>

        <div class="navbuttons">
          <!-- zoom in -->
          <m-button
            icon="zoom_in"
            title="Zoom in."
            @click="zoom($event.shiftKey ? 0.1 : 0.5)"
            />
          <!-- zoom out -->
          <m-button
            icon="zoom_out"
            title="Zoom out."
            @click="zoom($event.shiftKey ? 10 : 2)"
            />
          <!-- pan left -->
          <m-button
            icon="chevron_left"
            title="Pan left."
            @click="pan($event.shiftKey ? 0.8 : 0.2)"
            />
          <!-- pan right -->
          <m-button
            icon="chevron_right"
            title="Pan right."
            @click="pan($event.shiftKey ? -0.8 : -0.2)"
            />
        </div>

        <div>
          <!-- split region -->
          <m-button
            icon="compare"
            title="Split this region."
            @click="split()"
            />
          <!-- make reference region -->
          <m-button
            icon="room"
            title="Make this the reference region."
            @click="makeRef()"
            />
          <!-- remove region -->
          <m-button
            icon="delete_forever"
            color="red"
            title="Remove this region."
            @click="remove()"
            />
        </div>
      </div>
    </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import gc from '@/lib/GenomeCoordinates'
import u from '@/lib/utils'
export default MComponent({
  name: 'ZoomRegionControls',
  components: { MButton },
  props: [
  ],
  inject: ['regionManager'],
  data: function () {
    return {
      isOpen: false,
      x: 0,
      y: 0,
      formattedCoords: '',
      region: null
    }
  },
  methods: {
    open (region, y, x) {
      this.x = x
      this.y = y
      this.region = region
      this.isOpen = true
      this.reset()
    },
    close () {
      this.isOpen = false
    },
    zoom: function (amt) {
      this.$root.$emit('region-change', { region: this.region, vm: this, op: 'zoom', amt: amt })
    },
    pan: function (amt) {
      this.$root.$emit('region-change', { region: this.region, vm: this, op: 'scroll', amt: amt })
    },
    split: function () {
      this.$root.$emit('region-change', { region: this.region, vm: this, op: 'split', pos: 0.5 })
      this.close()
    },
    makeRef: function () {
      this.$root.$emit('region-change', { region: this.region, vm: this, op: 'make-reference' })
      this.close()
    },
    remove: function () {
      this.$root.$emit('region-change', { region: this.region, vm: this, op: 'remove' })
      this.close()
    },
    setCoords: function () {
      const val = this.formattedCoords
      const r = gc.parse(val)
      if (!r) {
        const f = this.dataManager.getGenologs(val, [this.region.genome])[0]
        if (f) {
          const l = f.end - f.start + 1
          const rr = {
            genome: this.region.genome,
            chr: f.chr,
            start: f.start - l,
            end: f.end + l
          }
          this.$root.$emit('region-change', { region: this.region, vm: this, op: 'set', coords: rr })
          this.close()
        } else {
          alert("Could not resolve coordinates.")
          this.reset()
        }
      } else {
        const rr = gc.validate(r, this.region.genome, true)
        this.$root.$emit('region-change', { region: this.region, vm: this, op: 'set', coords: rr })
        this.close()
      }
    },
    reset: function () {
      const r = this.region
      this.formattedCoords = `${r.chr.name}:${r.start}..${r.end}`
    },
    mgiSNPquery: function () {
      if (this.region.genome.name !== 'C57BL/6J') return;
      //
      const vgs = this.regionManager().currentGenomes().filter(g => g.name !== 'C57BL/6J')
      const selectedStrains = vgs.map(g => `selectedStrains=${g.name}`).join('&') || 'selectedStrains='
      const url_base = 'http://www.informatics.jax.org/snp/summary?'
      const url_parts = [
        `selectedChromosome=${this.region.chr.name}`,
        `coordinate=${this.region.start}..${this.region.end}`,
        `coordinateUnit=bp`,
        `startMarker=`,
        `endMarker=`,
        `referenceMode=yes`,
        `allowNullsForReferenceStrains=no`,
        `allowNullsForComparisonStrains=yes`,
        selectedStrains,
        'referenceStrains=C57BL/6J',
        `selectedTab=1#myDataTable=results=100`,
        `startIndex=0`,
        `sort=accid`,
        `dir=asc`
      ]
      const url = url_base + url_parts.join('&')
      window.open(url, '_blank')
    },
    mgiQTLquery: function () {
      if (this.region.genome.name !== 'C57BL/6J') return;
      const url_base = 'http://www.informatics.jax.org/allele/summary?'
      const url_parts = [
        `chromosome=${this.region.chr.name}`,
        `coordinate=${this.region.start}-${this.region.end}`,
        `coordUnit=bp`,
        `alleleType=QTL`
      ]
      const url = url_base + url_parts.join('&')
      window.open(url, '_blank')
    },
    mgiJBquery: function () {
      if (this.region.genome.name !== 'C57BL/6J') return;
      const url_base = 'http://jbrowse.informatics.jax.org/?'
      const url_parts = [
        `data=data/mouse`,
        `loc=chr${this.region.chr.name}:${this.region.start}..${this.region.end}`,
        `tracks=DNA,MGI_Genome_Features,NCBI_CCDS,NCBI,ENSEMBL`,
        `highlight=`
        ]
      const url = url_base + url_parts.join('&')
      window.open(url, '_blank')
    }
  },
  mounted: function () {
    // close me if user clicks on background
    this.$root.$el.addEventListener('click', () => this.close())
    this.$watch('region', () => this.reset(), {'deep' : true})
    u.dragify(this.$refs.dragHandle, {
      dragstart: function (e, d) {
        d.prevX = e.clientX
        d.prevY = e.clientY
      },
      drag: function (e, d) {
        this.x += e.clientX - d.prevX
        this.y += e.clientY - d.prevY
        d.prevX = e.clientX
        d.prevY = e.clientY
      },
      dragend: function (e, d) {
      }
    }, this.$parent.$el, this)
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
.zoom-region-controls {
  justify-content: flex-start;
  position: fixed;
  background-color: rgba(255,255,255,0.8);
  padding: 6px;
  border-radius: 4px;
  border: thin solid gray;
}
.row2 {
  justify-content: space-around;
}
.mgibuttons  .m-button {
  font-size: 12px;
  margin: 2px;
  padding: 1px;
  border: thin solid;
}
.mgibuttons label {
  font-size: 14px;
}
</style>
