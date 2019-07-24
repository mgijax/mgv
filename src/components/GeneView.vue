<template>
  <div
    class="gene-view flexcolumn"
    >
    <div
      v-for="(g,i) in genes"
      :key="i"
      class="gene flexcolumn"
      >{{g.ID}} {{g.symbol}}
      <div
        v-if="true"
        >
        <div
          v-for="(t,j) in g.transcripts"
          :key="i + '.' + j"
          class="transcript"
          >
          <div
            v-for="(e,k) in t.exons"
            :key="i + '.' + j + '.' + k"
            class="exon"
            :style="exonStyle(e, i, j)"
            >{{e.end - e.start + 1}}</div>
        </div>
      </div>
      <div>
      <div
        class="transcript"
        >
        <div
          v-for="(e,k) in g.composite.exons"
          :key="i + '.*.' + k"
          class="exon"
          :style="exonStyle(e)"
          >{{e.end - e.start + 1}}</div>
      </div>
      </div>
    </div>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import config from '@/config'
export default MComponent({
  name: 'GeneView',
  props: ['genes','spreadTranscripts'],
  data: function () {
    const c = config
    return {
      //   intronFringe (int) amount (in bp) to extend into the intron
      intronFringe: 20,
      // width (in px) of drawing area
      width: 800,
      // pixels per base
      ppb: 0.5
    }
  },
  mounted: function () {
    this.$root.$on('resize', () => this.resize())
  },
  watch: {
    genes: function () {
      this.layout()
    }
  },
  methods: {
    resize () {
      this.width = this.$el.getBoundingClientRect().width - 12
      this.genes.splice(0,0)
    },
    layout () {
      const maxTlen = Math.max.apply(null, this.genes.map(g => this.transcriptLength(g.composite)))
      this.ppb = this.width / maxTlen
      this.genes.forEach((g,i) => this.layoutGene(g,i))
    },
    layoutGene (gene, i) {
      this.layoutTranscript(gene.composite)
      gene.transcripts.forEach((t,j) => this.layoutTranscript2(t, gene.composite))
    },
    layoutTranscript (trans, i, j) {
      this.layoutExons(trans.exons, i, j)
    },
    layoutTranscript2 (trans, composite) {
      const ces = composite.exons
      let ci = 0
      trans.exons.forEach(e => {
        while (e.start > ces[ci].end) ci++;
        let de = (e.start - ces[ci].start) * this.ppb
        e.x = ces[ci].x + de
        e.width = this.ppb * (e.end - e.start + 1)
      })
    },
    transcriptLength (t) {
      return t.length + 2 * (t.exons.length - 1) * this.intronFringe
    },
    maxTranscriptLength (gene) {
      return Math.max.apply(null, gene.transcripts.map(t => this.transcriptLength(t)))
    },
    // Lays out the given exons (specified in bp) using the given conversion ppb (pixels per base).
    // Args:
    //   exons (list) Exons, each with start and end coordinates (in bp).
    // Returns:
    //   The exons, tagged with the computed coordinates (x and width, in pixels)
    layoutExons (exons, i, j) {
      // current x (in px) coord
      let x = 0
      // the amount (in px) for each intron fringe
      const intronWidth = this.intronFringe * this.ppb
      exons.forEach(e => {
         e.x = x
         e.width = this.ppb * (e.end - e.start + 1)
         x += e.width + 2 * intronWidth
      })
    },
    exonStyle (e, i, j) {
      return {
        left: e.x + 'px',
        top: '0px',
        width: e.width + 'px',
        height: '10px'
      }
    }
  }
})
</script>

<style scoped>
.gene {
  border: thin solid black;
}
.transcript {
  height: 15px;
  position: relative;
}
.exon {
  border: thin solid blue;
  background-color: blue;
  position: absolute;
  font-size: 10px;
  color: white;
}
</style>
