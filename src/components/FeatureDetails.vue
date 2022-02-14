<template>
  <div class="feature-details flexcolumn">
    <div class="controls flexrow">

        <span>
        <label>Show transcripts: </label>
        <select v-model="showTranscripts">
            <option value="all">all</option>
            <option value="selected">selected</option>
            <option value="none">none</option>
        </select>
        </span>

        <span>
        <label>Show exons: </label>
        <select v-model="showExons">
            <option value="all">all</option>
            <option value="selected">selected</option>
            <option value="none">none</option>
        </select>
        </span>

        <m-paginator
            :itemCount="features.length"
            :defaultPageSize="50"
            @m-paginator-changed="pageChange"/>
    </div>
    <table class="feature-table">
      <tr class="sticky-header" @click="toggleCollapsed">
        <th v-for="(col, ci) in columns"
            :key="'col.'+ci"
            :style="col.thStyle"
            :class="{ collapsed: isCollapsed(ci) }"
            >
            {{col.name}}
            <i v-if="col.name==='Attributes'"
                title="Open all"
                @click="openAllAttributes"
                class="material-icons"
                >add_circle</i>
            <i v-if="col.name==='Attributes'"
                title="Close all"
                @click="closeAllAttributes"
                class="material-icons"
                >remove_circle</i>
        </th>
      </tr>
      <tr
        v-for="(f,i) in featuresCurrentPage"
        :key="i"
        class="featureRow"
        >
        <td v-for="(col, ci) in columns"
            :key="'col.td.'+ci"
            :style="col.tdStyle"
            :class="col.tdClass"
            >
            <span v-if="col.name !== 'Attributes'">{{getCellValue(startIndex + i + 1, f, col.value)}}</span>
            <template v-else>
                <!-- when closed, shows this -->
                <span class="closed-text">{{ attributesClosedText(f) }}</span>
                <!-- when opened, list attributes one per line -->
                <table>
                    <tr v-for="(av,j) in attributesAsList(f)"
                      :key= "`f${i}a${j}`"
                      >
                      <td>{{av[0]}}</td>
                      <td><span class="crawling-text" @mouseover="startcrawl" @mouseout="stopcrawl" >{{av[1]}}</span></td>
                    </tr>
                </table>
                <i @click="clicked" class="material-icons open">add_circle</i>
                <i @click="clicked" class="material-icons close">remove_circle</i>
            </template>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
import MButton from '@/components/MButton'
import MPaginator from '@/components/MPaginator'
import u from '@/lib/utils'
export default MComponent({
  name: 'FeatureDetails',
  props: ['genes', 'transcripts', 'exons'],
  components: { MButton, MPaginator },
  data: function () {
      return {
          showTranscripts: 'selected', // one of: all, selected, none
          showExons: 'selected', // one of: all, selected, none
          collapsed: new Set(), // cellIndex vals for columns to be drawn collapsed
          columns: [{
              name: "#",
              value: "#",
              tdClass: { collapsed: false }
          }, {
              name: "Genome",
              value: "genome.name",
              tdClass: { collapsed: false }
          }, {
              name: "Symbol",
              value: "label",
              tdClass: { collapsed: false }
          }, {
              name: "Seqid",
              value: "seqid",
              tdClass: { collapsed: false }
          }, {
              name: "Source",
              value: "source",
              tdClass: { collapsed: false }
          }, {
              name: "Type",
              value: "type",
              tdClass: { collapsed: false }
          }, {
              name: "Start",
              value: "start",
              tdClass: { collapsed: false }
          }, {
              name: "End",
              value: "end",
              tdClass: { collapsed: false }
          }, {
              name: "Score",
              value: "score",
              tdClass: { collapsed: false },
              thStyle: "width:40px;",
              tdStyle: "text-align:center;"
          }, {
              name: "Strand",
              value: "strand",
              tdClass: { collapsed: false },
              thStyle: "width:40px;",
              tdStyle: "text-align:center;"
          }, {
              name: "Phase",
              value: "phase",
              tdClass: { collapsed: false },
              thStyle: "width:40px;",
              tdStyle: "text-align:center;"
          }, {
              name: "Attributes",
              value: "attributes",
              tdClass: { collapsed: false, attributes: true, open: false, closed: true },
              thStyle: "width:50%;padding-left:16px;"
          }],
          startIndex: 0,
          endIndex: 49
      }
  },
  computed: {
    features: function () {
        const myGenes = Array.from(this.genes).sort(this.featureSorter)
        const feats = myGenes.reduce((fs,g) => {
            fs.push(g)
            let ts
            if (this.showTranscripts === "all") {
                ts = g.transcripts
            } else if (this.showTranscripts === "selected") {
                ts = this.transcripts.filter(t => t.gene === g)
            } else {
                ts = []
            }
            ts = ts.reduce((ts2, t) => {
                ts2.push(t)
                let es
                if (this.showExons === "all") {
                    es = t.exons
                } else if (this.showExons === "selected") {
                    es = this.exons.filter(e => e.transcript === t)
                } else {
                    es = []
                }
                ts2 = ts2.concat(es)
                return ts2
            },[])
            fs = fs.concat(ts)
            return fs
        }, [])
        return feats
    },
    featuresCurrentPage: function () {
        return this.features.slice(this.startIndex, this.endIndex + 1)
    }
  },
  methods: {
    pageChange: function (d) {
        u.debug('m-paginator-changed', d)
        this.startIndex = d.startIndex
        this.endIndex = d.endIndex
    },
    getCellValue: function (i, f, name) {
        if (name === "#") return i
        return name.split('.').reduce((v,n) => {
            if (!v || v[n] === undefined) return '.'
            return v[n]
        }, f)
    },
    featureSorter: function (a, b) {
        const ag = a.genome.name
        const bg = b.genome.name
        const ac = a.chr.name
        const bc = b.chr.name
        if (ag !== bg) return ag < bg ? -1 : ag > bg ? 1 : 0
        if (ac !== bc) return ac < bc ? -1 : ac > bc ? 1 : 0
        return a.start - b.start
    },
    clicked: function (e) {
        const td = e.target.closest('td.attributes')
        this.toggleAttributes(td)
    },
    toggleCollapsed (ev) {
        const th = ev.target.closest('th')
        if (!th) return
        const ci = th.cellIndex
        const tdc = this.columns[ci].tdClass
        tdc.collapsed = !tdc.collapsed
    },
    isCollapsed (cellIndex) {
        return this.columns[cellIndex].tdClass.collapsed
    },
    openAttributes  (td) {
        td.classList.add('open')
        td.classList.remove('closed')
    },
    closeAttributes (td) {
        td.classList.add('closed')
        td.classList.remove('open')
    },
    toggleAttributes: function (td) {
        if (td.classList.contains('open')) {
            this.closeAttributes(td)
        } else {
            this.openAttributes(td)
        }
    },
    openAllAttributes (ev) {
        this.$el.querySelectorAll('td.attributes').forEach(t => this.openAttributes(t))
        ev.stopPropagation()
    },
    closeAllAttributes (ev) {
        this.$el.querySelectorAll('td.attributes').forEach(t => this.closeAttributes(t))
        ev.stopPropagation()
    },
    attributesClosedText (f) {
        const p = f.gene || f.transcript
        const ptext = p ? ` Parent=${p.label}` : ''
        const lbl = f.label || f.ID || f.attributes.Name || f.attributes.ID || ''
        return `${lbl}${ptext}`
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
    },
    startcrawl: function (e) {
       const elt = e.target
       const container = elt.closest('.feature-details')
       const rightEdge = container.getBoundingClientRect().right
       this.interval = window.setInterval(() => {
           const ebb = elt.getBoundingClientRect()
           if (ebb.right < rightEdge) {
               elt.style.left = "0px"
           } else {
               const left = elt.style.left || "0px"
               const ileft = parseInt(left.replace("px","")) - 1
               elt.style.left = ileft + "px"
           }
       }, 25)
    },
    stopcrawl: function (e) {
       if (this.interval) window.clearInterval(this.interval)
       this.interval = null
       e.target.style.left = "0px"
    }
  }
})
</script>

<style scoped>
.feature-details {
}
.feature-table th,
.feature-table td {
    padding-right: 10px;
}
.feature-table th.collapsed,
.feature-table td.collapsed {
    max-width: 4px;
    margin-right: 8px;
}
.feature-table-wrapper {
    max-height: 400px;
    overflow: scroll;
}
.controls {
    position: sticky;
    top: 18px;
    z-index: 10;
    background: #e1e1e1;
    justify-content: space-between;
}
.sticky-header {
    position: sticky;
    top: 56px;
    background: #e1e1e1;
    z-index: 100;
}
.feature-table {
  font-size: 12px;
  white-space: nowrap;
  border-spacing: 0px;
}
.feature-table * {
  vertical-align: top;
  text-align: left;
  overflow: hidden;
}
th > i.material-icons {
  opacity: 0;
}
th:hover > i.material-icons {
  opacity: 1;
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
table.feature-table > tr:nth-child(2n) {
    background-color: #ccc;
}
.crawling-text {
    position: relative;
}
</style>
