<template>
  <div class="sequences toolForm flexrow">
    <fieldset>
      <legend class="cart-label">Sequence Cart</legend>
      <sequence-cart
        title="Your shopping cart of selected sequences."
        ref="sequenceCart"
        />
    </fieldset>
    <div class="flexcolumn">
    <form
      target="_blank"
      :action="selectedTool.action"
      :enctype="selectedTool.enctype"
      :method="selectedTool.method"> 
      
      <!-- tool selector  and submit button -->
      <fieldset>
      <legend>Alignment Tools</legend>
      <div class="flexrow">
        <select class="toolSelector" name="tool" v-model="tool">
          <option
            v-for="(t,i) in tools"
            :key="t.name"
            :value="t.name"
            >{{t.label}}</option>
        </select>
        <button class="submitBtn">Submit</button>
      </div>
      <!-- tool info -->
      <div class="toolInfo flexcolumn">
        <span v-if="selectedTool.description">{{selectedTool.description}}</span>
        <span v-if="selectedTool.limits">(Tool's stated limits: {{selectedTool.limits}})</span>
      </div>
      </fieldset>
      <!-- Form parameter groups -->
      <fieldset
        v-for="(fs,i) in selectedTool.parameterSets"
        :key="i"
        >
      <legend>{{fs.name}}</legend>
      <m-button
        name="closeBtn"
        :icon="fs.isOpen ? 'close' : 'add'"
        :title="fs.isOpen ? 'Click to close.' : 'Click to open.'"
        @click.stop="fs.isOpen = !fs.isOpen"
        />
      <table v-show="fs.isOpen">
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
    </form> 
    </div>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import SequenceCart from '@/components/SequenceCart'
import FormParameter from '@/components/FormParameter'
import { reverseComplement, translate } from '@/lib/genetic_code'
import u from '@/lib/utils'
import etools from '@/lib/ensembl_tools'
export default MComponent({
  name: 'Sequences',
  components: {
    SequenceCart,
    FormParameter,
    MButton
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
        return s.header + '\n' + s.seq + '\n'
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
.toolInfo {
  align-items: flex-start;
  padding-left:40px;
  font-size: smaller;
}
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
  font-weight: bold;
}
.submitBtn {
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
fieldset {
 position: relative;
 border: 2px groove white;
}
fieldset > legend {
  font-weight: bold;
}
fieldset [name="closeBtn"] {
  position: absolute;
  top: 12px;
  right: 3px;
}
</style>
