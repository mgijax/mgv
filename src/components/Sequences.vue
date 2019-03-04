<template>
  <div class="sequences toolForm flexrow">
    <div class="flexcolumn">
      <label class="cart-label">Sequence Cart</label>
      <sequence-cart
        title="Your shopping cart of selected sequences."
        ref="sequenceCart"
        />
    </div>
    <div class="flexcolumn">
    <form
      target="_blank"
      :action="`https://www.ebi.ac.uk/Tools/services/web_${tool}/toolform.ebi`"
      enctype="multipart/form-data"
      method="post"> 
      
      <div class="flexrow">
        <label>Tool:</label>
        <select class="toolSelector" name="tool" v-model="tool">
          <option
            v-for="(t,i) in tools"
            :key="t.name"
            :value="t.name"
            >{{t.label}}</option>
        </select>
      </div>

      <fieldset
        v-for="(fs,i) in selectedTool.parameterSets"
        :key="i"
        >
      <legend>{{fs.name}}</legend>
      <table>
        <form-parameter
          v-for="(p,i) in fs.parameters"
          :key="i"
          :tool="selectedTool"
          :parameter="p"
          :labelXtra="length(p)"
          :sequence="sequence"
          :asequence="asequence"
          :bsequence="bsequence"
          @clear="clear"
          />
      </table>
      </fieldset>
      <button class="submitBtn">Submit</button>
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
import etools from '@/lib/ensembl_tools'
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
      tools: etools
    }
  },
  computed: {
    selectedTool: function () {
      return this.tools.filter(t => t.name === this.tool)[0]
    }
  },
  methods: {
    injectSequences: function (seqs) {
      const fseq = s => {
        return s.header + '\n' + (s.type === 'cds' ? translate(s.seq) : s.seq) + '\n'
      }
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
    clear: function (n) {
      this[n] = ''
    },
    length: function (p) {
      if (p.type.includes('sequence') && this[p.type].length > 0) {
        return `${this[p.type].length} characters`
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
.cart-label {
  padding-top: 15px;
  padding-bottom: 15px;
}
.submitBtn {
  width: 100%;
  background-color: #16ab16;
  color: white;
  font-size: 18px;
  font-weight: bold;
}
.submitBtn:hover {
}
.clearBtn {
  background-color: coral;
}
fieldset,
button {
  border-radius: 4px;
}
</style>
