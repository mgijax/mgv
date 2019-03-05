const jobParametersGroup = {
  name: '3. Job Parameters',
  parameters: [{
    name: 'notification',
    label: 'Email notification',
    type: 'checkbox'
  }, {
    name: 'title',
    label: 'Job title',
    type: 'text'
  }, {
    name: 'email',
    label: 'Email address',
    type: 'text'
  }]
}

const clustalo = {
  name: 'clustalo',
  label: 'Clustal+Omega',
  toolclass: 'multiple',
  parameterSets: [{
    name: '1. Inputs',
    parameters: [{
      name: 'isSAM',
      type: 'hidden',
      value: 'm'
    }, {
      name: 'stype',
      label: 'Sequence type',
      type: 'select',
      options: [{
        label: 'PROTEIN',
        value: 'protein'
      }, {
        label: 'DNA',
        value: 'dna'
      }, {
        label: 'RNA',
        value: 'rna'
      }]
    }, {
      name: 'sequence',
      label: 'Sequences',
      type: 'sequence'
    }, {
      name: 'upfile',
      label: 'OR upload a file of sequences',
      type: 'file'
    }]
  }, {
    name: '2. Tool Parameters',
    parameters: [{
      name: 'outfmt',
      label: 'Output format',
      type: 'select',
      options: [{
        selected: true,
        value: 'clustal_num',
        label: 'ClustalW with character counts'
      }, {
        value: 'clustal',
        label: 'ClustalW'
      }, {
        value: 'fa',
        label: 'Pearson/FASTA'
      }, {
        value: 'msf',
        label: 'MSF'
      }, {
        value: 'nexus',
        label: 'NEXUS'
      }, {
        value: 'phylip',
        label: 'PHYLIP'
      }, {
        value: 'selex',
        label: 'SELEX'
      }, {
        value: 'stockholm',
        label: 'STOCKHOLM'
      }, {
        value: 'vienna',
        label: 'VIENNA'
      }]
    }, {
      name: 'dealign',
      label: 'Dealign input sequences',
      type: 'select',
      options: [{
        value: 'false',
        label: 'no',
        selected: true
      }, {
        value: 'true',
        label: 'yes'
      }]
    }, {
      name: 'mbed',
      label: 'mBed-like clustering guide-tree',
      type: 'select',
      options: [{
        value: 'false',
        selected: true
      }, {
        value: 'true',
        label: 'no',
        label: 'yes'
      }]
    }, {
      name: 'mbediteration',
      label: 'mBed-like clustering iteration',
      type: 'select',
      options: [{
        value: 'false',
        label: 'no'
      }, {
        value: 'true',
        label: 'yes',
        selected: true
      }]
    }, {
      name: 'iterations',
      label: 'Number of combined iterations',
      type: 'select',
      options: [{
        value: '0',
        label: 'default(0)',
        selected: true
      }, '1', '2', '3', '4', '5']
    }, {
      name: 'gtiterations',
      label: 'Max guide tree iterations',
      type: 'select',
      options: [{
        value: '-1',
        label: 'default',
        selected: true
      }, '0', '1', '2', '3', '4', '5']
    }, {
      name: 'hmmiterations',
      label: 'Max HMM iterations',
      type: 'select',
      options: [{
        value: '-1',
        label: 'default',
        selected: true
      }, '0', '1', '2', '3', '4', '5']
    }, {
      name: 'order',
      label: 'Order',
      type: 'select',
      options: [{
        value: 'aligned',
        selected: true
      }, {
        value: 'input',
      }]
    }]
  }, 
  jobParametersGroup
]} // clustalo

const muscle = {
  name: 'muscle',
  label: 'MUSCLE',
  toolclass: 'multiple',
  parameterSets: [{
    name: '1. Inputs',
    parameters: [{
      name: 'isSAM',
      type: 'hidden',
      value: 'm'
    }, {
      name: 'stype',
      label: 'Sequence type',
      type: 'select',
      options: [{
        label: 'PROTEIN',
        value: 'protein'
      }, {
        label: 'DNA',
        value: 'dna'
      }, {
        label: 'RNA',
        value: 'rna'
      }]
    }, {
      name: 'sequence',
      label: 'Sequences',
      type: 'sequence'
    }, {
      name: 'upfile',
      type: 'file'
    }]
  }, {
    name: '2. Tool Parameters',
    parameters: [{
      name: 'format',
      label: 'Output format',
      type: 'select',
      options: [{
        value: 'fasta',
        label: 'Pearson/FASTA'
      }, {
        selected: true,
        value: 'clw',
        label: 'ClustalW'
      }, {
        value: 'clwstrict',
        label: 'ClustalW (strict)'
      }, {
        value: 'html',
        label: 'HTML'
      }, {
        value: 'msf',
        label: 'GCG MSF'
      }, {
        value: 'phyi',
        label: 'Phylip interleaved'
      }, {
        value: 'phys',
        label: 'Phylip sequential'
      }]
    }, {
      name: 'tree',
      label: 'Output tree',
      type: 'select',
      options: [{
        selected: true,
        value: 'none',
      }, {
        value: 'tree1',
        label: 'From first iteration'
      }, {
        value: 'tree2',
        label: 'From second iteration'
      }]
    }]
  },
  jobParametersGroup
]} // end muscle

const kalign = {
  name: 'kalign',
  label: 'Kalign',
  toolclass: 'multiple',
  parameterSets: [{
    name: '1. Inputs',
    parameters: [{
      name: 'isSAM',
      type: 'hidden',
      value: 'm'
    }, {
      name: 'stype',
      label: 'Sequence type',
      type: 'select',
      options: [{
        label: 'Protein',
        value: 'protein',
        select: true
      }, {
        label: 'Nucleid acid',
        value: 'dna'
      }]
    }, {
      name: 'sequence',
      label: 'Sequences',
      type: 'sequence'
    }, {
      name: 'upfile',
      type: 'file'
    }]
  },{ 
    name: '2. Tool Parameters',
    parameters: [{
      name: 'format',
      label: 'Output format',
      type: 'select',
      options: [{
        value: 'fasta',
        label: 'Pearson/FASTA'
      }, {
        selected: true,
        value: 'clu',
        label: 'ClustalW'
      }, {
        value: 'macsim',
        label: 'MACSIM'
      }]
    }, {
      name: 'gapopen',
      label: 'Gap open penalty',
      type: 'text',
      value: '11.0'
    }, {
      name: 'gapext',
      label: 'Gap extension penalty',
      type: 'text',
      value: '0.85'
    }, {
      name: 'termgap',
      label: 'Terminal gap penalties',
      type: 'text',
      value: '0.45'
    }, {
      name: 'bonus',
      label: 'Bonus score',
      type: 'text',
      value: '0.0'
    }]
  },
  jobParametersGroup
]} // end kalign
      
const genewise = {
  // ----------- GeneWise ------------------------
  name: 'genewise',
  label: 'GeneWise',
  toolclass: 'pairwise',
  parameterSets: [{
    name: '1. Inputs',
    parameters: [{
      name: 'isSAM',
      type: 'hidden',
      value: 'x'
    }, {
      name: 'asequence',
      label: 'Protein Sequence',
      type: 'asequence'
    }, {
      name: 'aupfile',
      type: 'file'
    }, {
      name: 'bsequence',
      label: 'DNA Sequence',
      type: 'bsequence'
    }, {
      name: 'bupfile',
      type: 'file'
    }]
  }, {
    name: '2. Tool Parameters',
    parameters: [{
      name: 'para',
      label: 'Show parameters',
      type: 'select',
      options: [{
        selected: true,
        value: 'true',
        label: 'ON'
      }, {
        value: 'false',
        label: 'OFF'
      }]
    }, {
      name: 'pretty',
      label: 'Pretty ascii',
      type: 'select',
      options: [{
        selected: true,
        value: 'true',
        label: 'ON'
      }, {
        value: 'false',
        label: 'OFF'
      }]
    }, {
      name: 'genes',
      label: 'Gene structure',
      type: 'select',
      options: [{
        selected: true,
        value: 'true',
        label: 'ON'
      }, {
        value: 'false',
        label: 'OFF'
      }]
    }, {
      name: 'trans',
      label: 'Translation',
      type: 'select',
      options: [{
        selected: true,
        value: 'true',
        label: 'ON'
      }, {
        value: 'false',
        label: 'OFF'
      }]
    }, {
      name: 'cdna',
      label: 'cDNA',
      type: 'select',
      options: [{
        selected: true,
        value: 'true',
        label: 'ON'
      }, {
        value: 'false',
        label: 'OFF'
      }]
    }, {
      name: 'embl',
      label: 'EMBL feature',
      type: 'select',
      options: [{
        selected: true,
        value: 'true',
        label: 'ON'
      }, {
        value: 'false',
        label: 'OFF'
      }]
    }, {
      name: 'ace',
      label: 'Ace file gene structure',
      type: 'select',
      options: [{
        selected: true,
        value: 'true',
        label: 'ON'
      }, {
        value: 'false',
        label: 'OFF'
      }]
    }, {
      name: 'gff',
      label: 'GFF output',
      type: 'select',
      options: [{
        selected: true,
        value: 'true',
        label: 'ON'
      }, {
        value: 'false',
        label: 'OFF'
      }]
    }, {
      name: 'diana',
      label: 'EMBL Feature For Diana',
      type: 'select',
      options: [{
        selected: true,
        value: 'true',
        label: 'ON'
      }, {
        value: 'false',
        label: 'OFF'
      }]
    }, {
      name: 'init',
      label: 'Local/global mode',
      type: 'select',
      options: [{
        selected: true,
        value: 'local',
        label: 'Local'
      }, {
        value: 'global',
        label: 'Global'
      }]
    }, {
      name: 'splice',
      LABEL: 'splice site',
      type: 'select',
      options: [{
        value: 'model',
        label: 'Modelled'
      }, {
        selected: true,
        value: 'flat',
        label: 'GT/AG only'
      }]
    }, {
      name: 'random',
      label: 'Random (null) model',
      type: 'select',
      options: [{
        selected: true,
        value: 'syn',
        label: 'Synchronous model'
      }, {
        value: 'flat',
        label: 'Flat model'
      }]
    }, {
      name: 'alg',
      label: 'Algorithm',
      type: 'select',
      options: [{
        selected: true,
        value: '623',
        label: 'GeneWise 623'
      }, {
        value: '2193',
        label: 'GeneWise 2193'
      }]
    }]
  },
  jobParametersGroup
]} // end genewise

export default [
  clustalo,
  muscle,
  kalign,
  genewise
]
