<template>
  <div class="feature-details">
    <table class="feature-table">
      <tr>
        <th>Genome</th>
        <th>Symbol</th>
        <th>Seqid</th>
        <th>Source</th>
        <th>Type</th>
        <th>Start</th>
        <th>End</th>
        <th style="width:40px;">Score</th>
        <th style="width:40px;">Strand</th>
        <th style="width:40px;">Phase</th>
        <th style="width:50%;padding-left:16px;">
            Attributes
            <i title="Open all." @click="openAllAttributes" class="material-icons">add_circle</i>
            <i title="Close all." @click="closeAllAttributes" class="material-icons">remove_circle</i>
            </th>
      </tr>
      <tr
        v-for="(f,i) in sortedFeatures"
        :key="i"
        class="featureRow"
        :class="{ current: isCurrent(f) }"
        >
        <td>{{f && f.genome.name || '.'}}</td>
        <td>{{f && f.label || '.'}}</td>
        <td>{{f && f.chr.name || '.'}}</td>
        <td>{{f && f.source || '.'}}</td>
        <td>{{f && f.type || '.'}}</td>
        <td>{{f && f.start || '.'}}</td>
        <td>{{f && f.end || '.'}}</td>
        <td style="text-align:center;">{{f && f.score || '.'}}</td>
        <td style="text-align:center;">{{f && f.strand || '.'}}</td>
        <td style="text-align:center;">{{f && f.phase || '.'}}</td>
        <td class="attributes closed">
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
  computed: {
    sortedFeatures: function () {
        const sfeats = this.features.concat([])
        sfeats.sort((a,b) => {
            const ag = a.genome.name
            const bg = b.genome.name
            const ac = a.chr.name
            const bc = b.chr.name
            if (ag !== bg) return ag < bg ? -1 : ag > bg ? 1 : 0
            if (ac !== bc) return ac < bc ? -1 : ac > bc ? 1 : 0
            return a.start - b.start
        })
        return sfeats
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
        return `${f.curie || f.ID}`
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
table {
  font-size: 12px;
  white-space: nowrap;
  border-spacing: 0px;
}
table * {
  vertical-align: top;
  text-align: left;
  overflow: hidden;
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
