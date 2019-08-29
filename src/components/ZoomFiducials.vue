<template>
  <g
    class="zoom-fiducials"
    :transform="translate()"
    >
  <g
    v-for="s in stacks"
    :key="s.cid"
    :name="s.cid"
    class="zoom-fstack"
    :transform="`translate(${deltaX}, 0)`"
    >
    <polygon
      class="fiducial"
      v-for="(p, i) in s.pairs"
      :key="i"
      :points="points(p[0], p[1])"
      :fill="color(p[0], p[1])"
      :fill-opacity="cfg.fillOpacity"
      :stroke="color(p[0], p[1])"
      stroke-opacity="0.3"
      />
    </g>
  </g>
</template>

<script>
import MComponent from '@/components/MComponent'
import u from '@/lib/utils'
export default MComponent({
  name: 'ZoomFiducials',
  props: ['features', 'currentMouseover',  'currentMouseoverT', 'height'],
  data: function () {
    return {
      deltaX: 0,
      stacks: []
    }
  },
  methods: {
    translate () {
      if (!this.$parent.$el) return ''
      let pbb = this.$parent.$el.getBoundingClientRect()
      return `translate(${-pbb.x}, ${-pbb.y})`
    },
    color: function (r1, r2) {
      return r1.strand === r2.strand ? 'black' : 'red'
    },
    points: function (r1, r2) {
      const p1 = `${r1.x},${r1.y + r1.height}`
      const p2 = `${r2.x},${r2.y}`
      const p3 = `${r2.x + r2.width},${r2.y}`
      const p4 = `${r1.x + r1.width},${r1.y + r1.height}`
      if (r1.strand === r2.strand) {
	  return `${p1} ${p2} ${p3} ${p4}`
      } else {
	  return `${p1} ${p3} ${p2} ${p4}`
      }
    },
    getStacks () {
      if (!this.cfg.showConnectors) return []
      if (this.cfg.connectorStyle === 'linear') {
        return this.getStacks_linear()
      } else if (this.cfg.connectorStyle === 'combinatorial') {
        return this.getStacks_combinatorial()
      } else {
        return []
      }
    },
    //
    getStacks_combinatorial () {
      const pel = this.$parent.$el
      if (!pel) return []
      // build index from canonical id -> lists (one per strip) of features with that cid
      //   { cid -> { cid, strips: [ [ fetaures in strip with that cid ] ] }
      const ix = {}
      pel.querySelectorAll('.zoom-strip').forEach((zel, zi) => {
       zel.querySelectorAll('.zoom-region').forEach(rel => {
        const rev = rel.classList.contains('reversed')
        rel.querySelectorAll('.feature.highlight.visible').forEach(fel => {
          const cid = fel.getAttribute('canonical')
          if (!cid) return
          const cdata = ix[cid] ? ix[cid] : { cid:cid, strips: [] }
          const rects = cdata.strips[zi] || []
	  const rect = fel.querySelector('.feature > rect').getBoundingClientRect()
	  rect.strand = fel.getAttribute('strand')
          if (rev) rect.strand = rect.strand === '+' ? '-' : '+'
          rects.push(rect)
          cdata.strips[zi] = rects
          ix[cid] = cdata
        })
       })
      })
      //
      const result = []
      for (let cid in ix) {
        const currRec = { cid: cid, pairs: [] }
        const cdata = ix[cid]
        // generate every pairing of features between successive rows
        cdata.strips.sort((a, b) => a[0].y - b[0].y)
        cdata.strips.forEach((rects, i) => {
          if (i === 0) return
          const prevRects = cdata.strips[i - 1]
          prevRects.forEach(r1 => rects.forEach(r2 => {
            currRec.pairs.push([r1, r2])
          }))
        })
        result.push(currRec)
      }
      return result
    },
    // Returns highlighted feature DOM nodes, grouped by canonical id and sorted by y-position
    getStacks_linear () {
      if (!this.$parent.$el) return []
      // all visible highlighted feature nodes
      let hnodes = []
      this.$parent.$el.querySelectorAll(`.feature.highlight`).forEach(n => {
        if (n.style.display !== 'none') hnodes.push(n)
      })
      // index: canonical id -> list of nodes
      let ix = {}
      hnodes.forEach(fn => {
        let cid = fn.getAttribute('canonical')
        if (cid) {
          if (cid in ix) {
            ix[cid].push(fn)
          } else {
            ix[cid] = [fn]
          }
        }
      })
      // 
      let stacks = []
      for (let fid in ix) {
        let rects = ix[fid].map(fn => {
          return { fn, rect: fn.querySelector('.feature > rect').getBoundingClientRect() }
        })
        rects.sort((a, b) => a.rect.y - b.rect.y)
        const pairs = rects.reduce((prs, r, i) => {
          if (i === 0) return prs
          prs.push([rects[i - 1].rect, r.rect])
          return prs
        }, [])
        stacks.push({ cid: fid, pairs })
      }
      return stacks
    }
  },
  mounted: function () {
    window.setInterval(() => { this.stacks = this.getStacks(), 500})
  }
})
</script>

<style scoped>
</style>
