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

  ///////////////////////////////////////////
  // Timestamp used at page load to determine whether to flush user's setting cache.
  //
  // IMPORTANT!!! You MUST update this value whenever this config file changes!!!
  TIMESTAMP: 'Tue May 9 06:59:39 EST 2019',
  ///////////////////////////////////////////

  //
  // global config settings, applied to every class
  //
  all: {
    VERSION: '2.0.0-beta', // code version.
    animDur: 0.5 // default animation duration in sec
  },
  MHeader: {
    title: "Multiple Genome Viewer (MGV)",
    logoLeft: 'assets/Alliance_logo.png',
    logoRight: 'assets/Alliance_logo.png',
    style: {
      backgroundColor: '#557f9e',
      color: '#ffffff'
    }
  },
  MGV: {
    defaultHash: 'regions=C57BL/6J::14:44798909..46294274/1019|CAROLI/EiJ::14:36689781..38185146/1019|A/J::14:37282962..38778327/1019&lock=on&highlight=MGI:2385001',
    genomeSets: [{
      label: 'DO/CC founders',
      genomes: '129S1/SvImJ,A/J,C57BL/6J,CAST/EiJ,NOD/ShiLtJ,NZO/HlLtJ,PWK/PhJ,WSB/EiJ',
      description: 'View the 8 collaborative cross founder strains'
    }, {
      label: 'B6 vs non-musculus',
      genomes: 'C57BL/6J,CAROLI/EiJ,PAHARI/EiJ,SPRET/EiJ',
      description: 'View C57BL/6J versus the non-musculus strains.'
    }, {
      label: 'Mouse, human, rat',
      genomes: 'C57BL/6J,H.sapiens,R.norvegicus',
      description: 'View C57BL/6J versus human and rat.'
    //}, {
      //label: 'All',
      //genomes: '129S1/SvImJ,A/J,AKR/J,BALB/cJ,C3H/HeJ,C57BL/6J,C57BL/6NJ,CAROLI/EiJ,CAST/EiJ,CBA/J,DBA/2J,FVB/NJ,LP/J,PAHARI/EiJ,NOD/ShiLtJ,NZO/HlLtJ,PWK/PhJ,SPRET/EiJ,WSB/EiJ,C57BL/6J',
      //description: 'View all 19 strains (WARNING: may take a while to load and will be sluggish drawing large regions.)'
    }],
    //
    includeParalogs: false
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
  RangeBoxes: {
    trackMouse: true,
  },
  ZoomView: {
  },
  ZoomControls: {
    defaultZoom: 2, // multipler for zooming out, divisor for zooming in
    defaultPan: 0.15 // multiplier for panning right, -multiplier for left
  },
  ZoomMain: {
    stripGap: 40
  },
  ZoomStrip: {
    endCapColor: '#ccc',
    endCapFontColor: '#444',
    refEndCapColor: '#ff7f0e',
    refEndCapFontColor: '#fff',
    endCapWidth: 12
  },
  ZoomRegion: {
    minWidth: 0.02, // minimum region width, as a fraction of total width
    minHeight: 60,  // minimum region height in pixels
    pad: 3,
    featureHeight: 10,
    laneGap: 6,
    featureFontSize: 10,
    transcriptFontSize: 10,
    sequenceFontSize: 10,
    detailThreshold: 3000000,
    detailThresholdLimit: 20000000,
    spreadTranscripts: false,
    showFeatureLabels: true,
    showTranscriptLabels: false,
    showStartStopCodons: true,
    contrast: 0,
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
  ZoomFiducials: {
    showConnectors: true,
    fillOpacity: 0.05,
    showInversions: true
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
  SequenceCart: {
    dbName: DATACACHE_PREFIX + 'user-seqs'
  },
  DataManager: {
    featureSizeLimit: 10000000
  },
  PreferencesManager: {
    dbName: DATACACHE_PREFIX + 'user-prefs'
  },
  HelpBox: {
    showOnStartup: true
  }
}
