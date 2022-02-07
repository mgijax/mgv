<template>
  <div class="gene-view flexcolumn" >
    <div class="sticky-header flexcolumn">
        <!-- Controls -->
        <div class="controls flexrow" style="justify-content: flex-start;">

            <!-- Toggle: drawing style -->
            <div class="flexcolumn">
            <span class="small-label">Layout</span>
            <div class="flexrow" style="justify-content: flex-start;">
                <span class="small-label">Normal</span>
                <m-button
                  :icon="showTranscriptGraphs ? 'toggle_on' : 'toggle_off'"
                  :title="showTranscriptGraphs ? '' : ''"
                  @click="showTranscriptGraphs = !showTranscriptGraphs"
                  />
                <span class="small-label">Graphs</span>
            </div>
            </div>

            <!-- Toggle: Fit to width 
            <div class="flexcolumn">
            <span class="small-label">Fit to view</span>
            <div class="flexrow" style="justify-content: flex-start;">
                <span class="small-label">No</span>
                <m-button
                  :icon="fitToWidth ? 'toggle_on' : 'toggle_off'"
                  :title="fitToWidth ? 'Using fixed scale. Click for proportional scale.' : 'Using proportional scale. Click for fixed scale.'"
                  @click="fitToWidth = !fitToWidth"
                  />
                <span class="small-label">Yes</span>
            </div>
            </div>
            -->

            <!-- Toggle: exon width  -->
            <div class="flexcolumn">
            <span class="small-label">Exon scale</span>
            <div class="flexrow" style="justify-content: flex-start;">
                <span class="small-label">Fixed</span>
                <m-button
                  :icon="fixedExonWidths ? 'toggle_off' : 'toggle_on'"
                  :title="fixedExonWidths ? 'Using fixed scale. Click for proportional scale.' : 'Using proportional scale. Click for fixed scale.'"
                  @click="fixedExonWidths = !fixedExonWidths"
                  />
                <span class="small-label">Proportional</span>
            </div>
            </div>

            <!-- Slider: exon width  -->
            <div class="slider" >
                <span class="small-label">Exon width</span>
                <input type="range" min="1" max="200" v-model="exonWidthM" />
            </div>
            <!-- Slider: Intron gap  -->
            <div class="slider">
                <span class="small-label">Intron gap</span>
                <input type="range" min="1" max="100" v-model="intronGapM" />
            </div>
            <!-- Slider: Exon thickness  -->
            <div class="slider">
                <span class="small-label">Exon thickness</span>
                <input type="range" min="1" max="24" v-model="exonHeightM" />
            </div>
            <!-- Slider: Vertical gap  -->
            <div class="slider">
                <span class="small-label">Vertical gap</span>
                <input type="range" min="1" max="32" v-model="vertGapM" />
            </div>
        </div>
        <!-- Status/messages -->
        <div class="flexrow status-area">
            <span>{{statusText}}</span>
        </div>
    </div> <!-- end of sticky-header -->
    <div style="overflow:scroll;">
        <gene-view-gene
            v-for="(g,i) in genes"
            :key="'gvg.'+i"
            ref="gvgs"
            :gene="g"
            :width="width"
            :exonWidth="exonWidth"
            :exonHeight="exonHeight"
            :intronGap="intronGap"
            :vertGap="vertGap"
            :showTranscriptGraph="showTranscriptGraphs"
            :fixedExonWidths="fixedExonWidths"
            :fitToWidth="fitToWidth"
            :selectedColor="selectedColor"
            :selectedColor2="selectedColor2"
            />
    </div>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import GeneViewGene from '@/components/GeneViewGene'
import MButton from '@/components/MButton'
export default MComponent({
  name: 'GeneView',
  components: { MButton, GeneViewGene },
  props: ['genes'],
  inject: ['featureColorMap', 'dataManager'],
  data: function () {
    return {
      // width (in px) of drawing area
      width: 800,
      // calculated maximum display width of any gene
      maxGeneWidth: 800,
      //
      vertGapM: "16",
      exonHeightM: "10",
      exonWidthM: "25",
      intronGapM: "40",
      //
      showTranscriptGraphs: false,
      fitToWidth: false,
      fixedExonWidths: false,
      //
      selectedColor: "rgb(255, 255, 255)",
      selectedColor2: "rgb(52, 255, 154)"
    }
  },
  mounted: function () {
    this.$root.$on('resize', () => {
        this.width = this.$el.getBoundingClientRect().width
    })
  },
  computed: {
      vertGap:  function () { return parseFloat(this.vertGapM) },
      exonHeight: function () { return parseFloat(this.exonHeightM) },
      exonWidth: function () { return parseFloat(this.exonWidthM) },
      intronGap: function () { return parseFloat(this.intronGapM) },
      statusText: function () {
          if (!this.genes || this.genes.length === 0) return "No genes selected."
          //return this.genes.map(g => g.label).join(", ")
          return this.app.currentSelectionT.map(t => t.label).join(", ")
      }
  }
})
</script>

<style scoped>
.gene-view {
}
.controls > * {
    flex-grow: 0;
    margin-right: 16px;
}
.gene {
  border-bottom: thin solid black;
}
.transcript {
  height: 15px;
}
.exon {
}
.exon-label {
  position: absolute;
  left: 0px;
  bottom: 6px;
  font-size: 10px;
  font-weight: bold;
  color: black;
}
.connector {
}
.small-label {
  font-size: 10px;
}
.status-area {
  white-space: nowrap;
  overflow: scroll;
  font-size: 10px;
}
.sticky-header {
  border-bottom: thin solid black;
  position: sticky;
  top: 18px;
  left: 0;
  background-color: #e1e1e1;
  z-index: 10;
}
.slider {
    padding-top: 0px;
    padding-bottom: 0px;
    width: 80px;
}
.slider * {
    padding-top: 0px;
    padding-bottom: 0px;
}
.underlay {
    pointer-events: none;
}
.disabled, .disabled * {
    color: gray;
    pointer-events: none;
}
</style>
