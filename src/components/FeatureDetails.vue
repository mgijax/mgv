<template>
  <div class="feature-details">
    <!--
    <table>
      <tr>
        <th>Canonical ID</th>
        <th>Symbol</th>
        <th>Genome</th>
        <th>ID</th>
        <th>Type</th>
        <th>Coordinates</th>
        <th>Length</th>
      </tr>
      <tr
        v-for="(f,i) in features"
        :key="i"
        :class="{ current: isCurrent(f) }"
        >
        <td v-html="makeLink(f)"></td>
        <td>{{f && f.symbol || '.'}}</td>
        <td>{{f && f.genome.name || '.'}}</td>
        <td>{{f && f.ID || '.'}}</td>
        <td>{{f && f.type || '.'}}</td>
        <td>{{f && `${f.chr.name}:${f.start}..${f.end} (${f.strand})` || '.'}}</td>
        <td>{{f && f.length || '.'}}</td>
      </tr>
    </table>
    -->
    <table class="feature-table" style="table-layout:fixed; width:100%;">
      <tr>
        <th>Seqid</th>
        <th>Source</th>
        <th>Type</th>
        <th>Start</th>
        <th>End</th>
        <th>Score</th>
        <th>Strand</th>
        <th>Phase</th>
        <th style="width:50%;padding-left:16px;">
            Attributes
            <i title="Open all." @click="openAllAttributes" class="material-icons">add_circle</i>
            <i title="Close all." @click="closeAllAttributes" class="material-icons">remove_circle</i>
            </th>
      </tr>
      <tr
        v-for="(f,i) in features"
        :key="i"
        class="featureRow"
        :class="{ current: isCurrent(f) }"
        >
        <td>{{f && f.chr.name || '.'}}</td>
        <td>{{f && f.source || '.'}}</td>
        <td>{{f && f.type || '.'}}</td>
        <td>{{f && f.start || '.'}}</td>
        <td>{{f && f.end || '.'}}</td>
        <td>{{f && f.score || '.'}}</td>
        <td style="font-size: large;">{{f && f.strand || '.'}}</td>
        <td>{{f && f.phase || '.'}}</td>
        <td class="attributes closed">
            <!-- when closed, shows this -->
            <span>{{ attributesClosedText(f) }}</span>
            <!-- when opened, list attributes one per line -->
            <table>
                <tr v-for="(av,j) in attributesAsList(f)"
                  :key= "`f${i}a${j}`"
                  >
                  <td>{{av[0]}}</td>
                  <td>{{av[1]}}</td>
                </tr>
            </table>
            <i @click="clicked" class="material-icons open">add_circle</i>
            <i @click="clicked" class="material-icons close">remove_circle</i>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
export default MComponent({
  name: 'FeatureDetails',
  props: {
    features: {
      default: function () { return [] }
    },
    currentMouseover: Object
  },
  data: function () {
      return {
      }
  },
  methods: {
    isCurrent: function (f) {
      if (!f) return false
      let cmo = this.currentMouseover
      return cmo && cmo.ID === f.ID && cmo.genome === f.genome
    },
    clicked: function (e) {
        const tbl = e.target.closest('td.attributes')
        this.toggleAttributes(tbl)
    },
    openAttributes  (tbl) {
        tbl.classList.remove('closed')
        tbl.classList.add('open')
    },
    closeAttributes (tbl) {
        tbl.classList.add('closed')
        tbl.classList.remove('open')
    },
    toggleAttributes: function (tbl) {
        if (tbl.classList.contains('closed')) {
            this.openAttributes(tbl)
        } else {
            this.closeAttributes(tbl)
        }
    },
    openAllAttributes () {
        this.$el.querySelectorAll('td.attributes').forEach(t => this.openAttributes(t))
    },
    closeAllAttributes () {
        this.$el.querySelectorAll('td.attributes').forEach(t => this.closeAttributes(t))
    },
    attributesClosedText (f) {
        return `${f.curie || f.ID} ${f.symbol}`
    },
    attributesAsList (f) {
        const preferredOrder = ['ID','curie','Name']
        const entries = Object.entries(f.attributes)
        const comparator = (a,b) => {
                const akey = a[0]
                const bkey = b[0]
                const ai = preferredOrder.indexOf(akey)
                const bi = preferredOrder.indexOf(bkey)
                if (ai == -1) {
                    if (bi == -1) {
                       return akey < bkey ? -1 : akey > bkey ? 1 : 0
                    } else {
                       return 1
                    }
                } else if (bi == -1) {
                    return -1
                } else {
                    return ai - bi
                }
            }
        entries.sort(comparator)
        return entries
    }
  }
})
</script>

<style scoped>
table {
  width: 100%;
  font-size: 12px;
  white-space: nowrap;
}
table * {
  vertical-align: top;
  text-align: left;
  overflow: hidden;
}
table tr.current {
  background-color: #eee;
}
td.attributes.closed tr:nth-child(1) {
  display: inherit;
}
td.attributes.closed tr {
  display: none;
}
td.attributes.closed > table {
    display: none;
}
td.attributes.open > span {
    display: none;
}
i.material-icons {
  font-size: 16px;
  cursor: pointer;
}
td.attributes {
  padding-left: 16px;
  position: relative;
}
td.attributes i.material-icons {
  position: absolute;
  top: 0px;
  left: 0px;
  display: none;
}
td.attributes.open:hover i.material-icons.close {
  display: inherit;
}
td.attributes.closed:hover i.material-icons.open {
  display: inherit;
}
/* zebra striping */
table.feature-table tr:nth-child(2n) {
    background-color: #ccc;
}
/* zebra striping, inner table */
table.feature-table tr:nth-child(2n) table tr:nth-child(2n) {
    background-color: #e1e1e1;
}
</style>
