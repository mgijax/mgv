/*
 * config.js
 * Configuration by class. Settings under 'all' are applied to every class, followed
 * by those user the specific class.
 * Uses the 'name' attribute in the passed config to identify the class. If no name is present,
 * only the global settings are applied.
 */
const DATACACHE_PREFIX = 'mgv2-datacache-'
//
export default {
  //
  // global config settings, applied to every class
  //
  all: {
    VERSION: '2.0.0', // code version.
    animDur: 0.5 // default animation duration in sec
  },
  PageBox: {
  },
  MGV: {
    genomeSets: [{
      label: 'DO/CC founders',
      ref: 'C57BL/6J',
      genomes: '129S1/SvImJ,A/J,C57BL/6J,CAST/EiJ,NOD/ShiLtJ,NZO/HlLtJ,PWK/PhJ,WSB/EiJ',
      description: 'View the 8 collaborative cross founder strains'
    }, {
      label: 'B6 vs non-musculus',
      ref: 'C57BL/6J',
      genomes: 'C57BL/6J,CAROLI/EiJ,PAHARI/EiJ,SPRET/EiJ',
      description: 'View C57BL/6J versus the non-musculus strains.'
    }, {
      label: 'All',
      ref: 'C57BL/6J',
      genomes: '129S1/SvImJ,A/J,AKR/J,BALB/cJ,C3H/HeJ,C57BL/6J,C57BL/6NJ,CAROLI/EiJ,CAST/EiJ,CBA/J,DBA/2J,FVB    /NJ,LP/J,PAHARI/EiJ,NOD/ShiLtJ,NZO/HlLtJ,PWK/PhJ,SPRET/EiJ,WSB/EiJ C57BL/6J',
      description: 'View all 19 strains (WARNING: may take a while to load and will be sluggish drawing large regions.)'
    }]
  },
  FeatureColorMap: {
    colors: [{
      type: 'protein_coding_gene',
      color: 'rgb(31, 119, 180)'
    }, {
      type: 'pseudogene',
      color: 'rgb(255, 127, 14)'
    }, {
      type: 'ncRNA_gene',
      color: 'rgb(44, 160, 44)'
    }, {
      type: 'gene_segment',
      color: 'rgb(214, 39, 40)'
    }, {
      type: 'other_gene',
      color: 'rgb(148, 103, 189)'
    }, {
      type: 'other_feature_type',
      color: 'rgb(140, 86, 75)'
    }]
  },
  ZoomView: {
  },
  ZoomControls: {
    defaultZoom: 2, // multipler for zooming out, divisor for zooming in
    defaultPan: 0.15 // multiplier for panning right, -multiplier for left
  },
  ZoomStrip: {
    endCapColor: '#ccc',
    refEndCapColor: 'blue',
    endCapWidth: 12
  },
  ZoomRegion: {
    pad: 3,
    featureAlignment: '5-prime', // one of: '5-prime', '3-prime', 'proximal', 'distal', 'midpoint'
    featureHeight: 10,
    laneGap: 6,
    featureFontSize: 10,
    transcriptFontSize: 10,
    sequenceFontSize: 10,
    trackMouse: true,
    detailThreshold: 3000000,
    detailThresholdLimit: 10000000,
    sequenceThreshold: 1000,
    sequenceThresholdLimit: 10000,
    spreadTranscripts: true,
    showFeatureLabels: true,
    showTranscriptLabels: false,
    showStartStopCodons: true,
    currentFeature: {
      stroke: '#ffff00',
      strokeWidth: 2
    },
    selectedFeature: {
      stroke: '#34ff9a',
      strokeWidth: 2
    },
    baseColors: {
      a: 'blue',
      A: 'blue',
      c: 'purple',
      C: 'purple',
      t: 'green',
      T: 'green',
      g: 'red',
      G: 'red'
    }
  },
  GenomeView: {
    openHeight: 250,
    closedHeight: 100
  },
  GenomeViewChromosome: {
    chrWidth: 20
  },
  GenomeSelector: {
  },
  CachingFetcher: {
    dbName: DATACACHE_PREFIX + 'urls'
  },
  ListManager: {
    dbName: DATACACHE_PREFIX + 'user-lists'
  },
  Translator: {
    dbName: DATACACHE_PREFIX + 'blocks'
  },
  DataManager: {
    // when loading transcripts+exons from DataSource, the size block to chop the chromosome into
    transcriptBlockSize: 2000000,
    // max size allowed for a feature
    featureSizeLimit: 10000000
  },
  PreferencesManager: {
    dbName: DATACACHE_PREFIX + 'user-prefs'
  },
  InterMineConnection: {
    mines: [{
      name: 'MouseMine',
      url: 'http://www.mousemine.org/mousemine',
    }, {
      name: 'HumanMine',
      url: 'http://www.humanmine.org/humanmine'
    }, {
      name: 'FlyMine',
      url: 'http://www.flymine.org/flymine'
    }]
  }
}
