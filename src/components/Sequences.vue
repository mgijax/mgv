<template>
  <div class="sequences toolForm flexrow">
    <sequence-cart
      title="Your shopping cart of selected sequences."
      ref="sequenceCart"
      style="flex-grow: 1;"
      />
    <div class="flexcolumn">
    <form
      target="_blank"
      :action="`https://www.ebi.ac.uk/Tools/services/web_${tool}/toolform.ebi`"
      enctype="multipart/form-data"
      method="post"> 
      
      <div class="flexrow">
        <button class="submitBtn">Submit</button>
        <select class="toolSelector" name="tool" v-model="tool">
          <option
            v-for="(t,i) in tools"
            :key="t.name"
            :value="t.name"
            >{{t.label}}</option>
        </select>
        <button class="clearBtn" @click.stop.prevent="clear">Clear sequences</button>
      </div>

      <table>
        <form-parameter
          v-for="(p,i) in selectedTool.parameters"
          :key="i"
          :tool="selectedTool"
          :parameter="p"
          :labelXtra="length(p)"
          :sequence="sequence"
          :asequence="asequence"
          :bsequence="bsequence"
          />
      </table>
    </form> 
    </div>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import SequenceCart from '@/components/SequenceCart'
import FormParameter from '@/components/FormParameter'
import { translate } from '@/lib/genetic_code'
import u from '@/lib/utils'
export default MComponent({
  name: 'Sequences',
  components: {
    SequenceCart,
    FormParameter
  },
  data: function () {
    return {
      sequence: '',
      asequence: '',
      bsequence: '',
      tool: 'clustalo',
      tools: [{
        // ----------- Clustal-Omega -----------------
        name: 'clustalo',
        label: 'Clustal+Omega',
        toolclass: 'multiple',
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
        }, {
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
          label: 'DEALIGN INPUT SEQUENCES',
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
          label: 'MBED-LIKE CLUSTERING GUIDE-TREE',
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
          label: 'MBED-LIKE CLUSTERING ITERATION',
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
          label: 'NUMBER of COMBINED ITERATIONS',
          type: 'select',
          options: [{
            value: '0',
            label: 'default(0)',
            selected: true
          }, '1', '2', '3', '4', '5']
        }, {
          name: 'gtiterations',
          label: 'MAX GUIDE TREE ITERATIONS',
          type: 'select',
          options: [{
            value: '-1',
            label: 'default',
            selected: true
          }, '0', '1', '2', '3', '4', '5']
        }, {
          name: 'hmmiterations',
          label: 'MAX HMM ITERATIONS',
          type: 'select',
          options: [{
            value: '-1',
            label: 'default',
            selected: true
          }, '0', '1', '2', '3', '4', '5']
        }, {
          name: 'order',
          label: 'ORDER',
          type: 'select',
          options: [{
            value: 'aligned',
            selected: true
          }, {
            value: 'input',
          }]
        }, {
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
        }] // paremeter list
      // end tool clustal-omega
      }, {
        // ----------- Muscle ------------------------
        name: 'muscle',
        label: 'MUSCLE',
        toolclass: 'multiple',
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
        }, {
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
          label: 'OUTPUT TREE',
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
        }, {
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
      // end tool muscle
      }, {
        // ----------- KAlign ------------------------
        name: 'kalign',
        label: 'Kalign',
        toolclass: 'multiple',
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
        }, {
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
          label: 'GAP OPEN PENALTY',
          type: 'text',
          value: '11.0'
        }, {
          name: 'gapext',
          label: 'GAP EXTENSION PENALTY',
          type: 'text',
          value: '0.85'
        }, {
          name: 'termgap',
          label: 'TERMINAL GAP PENALTIES',
          type: 'text',
          value: '0.45'
        }, {
          name: 'bonus',
          label: 'BONUS SCORE',
          type: 'text',
          value: '0.0'
        }, {
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
      }, {
        // ----------- GeneWise ------------------------
        name: 'genewise',
        label: 'GeneWise',
        toolclass: 'pairwise',
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
        }, {
          name: 'para',
          label: 'SHOW PARAMETERS',
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
          label: 'PRETTY ASCII',
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
          label: 'GENE STRUCTURE',
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
          label: 'TRANSLATION',
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
          label: 'EMBL FEATURE',
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
          label: 'ACE FILE GENE STRUCTURE',
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
          label: 'GFF OUTPUT',
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
          label: 'EMBL Feature For diana',
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
          label: 'LOCAL/GLOBAL MODE',
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
          label: 'SPLICE SITE',
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
          label: 'RANDOM (NULL) MODEL',
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
          label: 'ALGORITHM',
          type: 'select',
          options: [{
            selected: true,
            value: '623',
            label: 'GeneWise 623'
          }, {
            value: '2193',
            label: 'GeneWise 2193'
          }]
        }, {
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
      }] // end tools list
    }
  },
  computed: {
    selectedTool: function () {
      return this.tools.filter(t => t.name === this.tool)[0]
    }
  },
  methods: {
    injectSequences: function (seqs) {
      const fseq = s => s.header + '\n' + (s.type === 'cds' ? translate(s.seq) : s.seq) + '\n'
      if (this.selectedTool.toolclass === 'multiple') {
        this.sequence = seqs.map(s => fseq(s)).join('')
      } else {
        seqs.forEach(s => {
          if (s.type === 'cds') {
            this.asequence = fseq(s)
          } else {
            this.bsequence = fseq(s)
          }
        })
      }
    },
    clear: function () {
      this.sequence = ''
      this.asequence = ''
      this.bsequence = ''
    },
    length: function (p) {
      if (p.type.includes('sequence') && this[p.type].length > 0) {
        return u.prettyPrintBases(this[p.type].length)
      }
      return ''
    }
  },
  mounted: function () {
    this.$root.$on('sequence-cart-sequences', seqs => this.injectSequences(seqs))
  }
})
</script>

<style scoped>
.toolForm {
  align-items: flex-start;
}
.toolForm table {
  text-align: left;
}
.toolSelector,
.clearBtn,
.submitBtn {
  height: 40px;
  flex-grow: 1;
}
.submitBtn {
  background-color: green;
}
.clearBtn {
  background-color: coral;
}
</style>
