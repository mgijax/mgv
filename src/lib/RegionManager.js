
import config from '@/config'

class RegionManager {
  constructor (app) {
    this.app = app
    this.app.$root.$on('region-change', d => this.changeRegion(d))
  }
  changeRegion (d) {
    if (d.op === 'scroll') {
      d.vm.region.start += d.delta
      d.vm.region.end += d.delta
    } else if (d.op === 'zoom') {
      d.vm.region.start = d.coords.start
      d.vm.region.end = d.coords.end
    } else if (d.op === 'remove') {
      this.removeRegion(d.vm.region)
    }
    this.app.$root.$emit('context', {})
  }
  removeRegion (r) {
    this.app.strips.forEach(s => {
      const i = s.regions.indexOf(r)
      if (i >= 0) {
        s.regions.splice(i, 1)
      }
    })
    this.layout()
  }
  layout (strips, width) {
    strips = strips || this.app.strips
    width = width || this.app.zoomWidth
    strips.forEach(strip => {
      this.layoutStrip(strip, width)
    })
    return strips
  }
  layoutStrip (strip, width) {
    // Compute lengths and total
    let totalLength = strip.regions.reduce((tl, r) => {
      r.length = r.end - r.start + 1
      return tl + r.length
    }, 0)
    // Adjust to expand tiny regions
    // 'Tiny' === less than some % of the total length
    const minLength = totalLength * 0.02
    let debit = 0
    strip.regions.forEach(r => {
      const delta = minLength - r.length
      if (delta > 0) {
        debit += delta
        r.start -= Math.floor(delta / 2)
        r.end = r.start + minLength - 1
        r.length = minLength
      }
    })
    totalLength += debit
    // Compute screen coordinates
    let dx = 12
    let gap = 2
    let totalGap = dx + gap * (strip.regions.length - 1)
    const ppb = (width - totalGap) / totalLength
    strip.regions.forEach(r => {
      let w = ppb * (r.end - r.start + 1)
      r.width = w
      r.deltaX = dx
      dx += r.width + gap
    })
  }
  // Maps a given region (genome+chr+start+end) to the equivalent regions in the given list of genomes
  // Returns a promise for the list of strips
  computeMappedRegions (r, genomes, width) {
    const tr = this.app.translator
    const promises = genomes.map(g => {
      return tr.translate(r.genome, r.chr.name, r.start, r.end, g).then(rs => {
        return {
          genome: g,
          regions: this.combineRegions(rs)
        }
      })
    })
    return Promise.all(promises).then(strips => {
      return this.layout(strips, width)
    })
  }
  combineRegions (regions) {
    // Combine regions whose indexes form a sequence
    regions.sort((a, b) => a.index - b.index)
    regions = regions.reduce((nrs, r) => {
      let prev = nrs[nrs.length - 1]
      if (prev && prev.index === r.index) {
        return nrs
      } else if (prev && prev.index + 1 === r.index) {
        prev.end = r.end
        prev.index = r.index
      } else {
        nrs.push(r)
      }
      return nrs
    }, [])
    return regions
  }
  //
  computeLandmarkRegions (lcoords, genomes, width) {
    const p = Promise.all(genomes.map(g => this.app.dataManager.ensureFeatures(g)))
    return p.then(() => genomes.map(g => this.computeLandmarkRegion(lcoords, g, width)))
  }
  //
  computeLandmarkRegion (lcoords, genome, width) {
    // landmark mode
    const delta = lcoords.delta
    const w = lcoords.length
    const alignOn = config.ZoomRegion.featureAlignment
    const lm = this.app.dataManager.getGenolog(lcoords.landmark, genome)
    let lmp
    switch (alignOn) {
    case '5-prime':
      lmp = lm.strand === '+' ? lm.start : lm.end
      break
    case '3-prime':
      lmp = lm.strand === '+' ? lm.end : lm.start
      break
    case 'proximal':
      lmp = lm.start
      break
    case 'distal':
      lmp = lm.end
      break
    case 'midpoint':
      lmp = Math.floor((lm.start + lm.end) / 2)
      break
    default:
    }
    const s = Math.round(lmp - w / 2) + delta
    /*
    if (genome === this.context.rGenome) {
      // if here, I am the ZoomStrip for the reference genome and we have just computed the actual
      // coordinates from the landmark feature. Need to inform the app what those coordinates are.
      const c = this.app.coords
      c.chr = lm.chr
      c.start = s
      c.end = s + w - 1
    }
    */
    return {
      genome: genome,
      regions: [{
        genome: genome,
        chr: lm.chr,
        start: s,
        end: s + w - 1,
        width: width
      }]
    }
  }
  // 
  _computeRegions (regions) {
    const cr = this.context.regions
    const cc = this.context.coords
    const lcc = this.context.lcoords
    if (!this.genome.chromosomes) {
      // if here, this is a very early call before everybody is initialized.
      // IMPORANT: need to touch start/end here so that they register with reactivity system
      // (Is there a better way??)
      this.regions = this.layoutRegions([{
        genome: this.genome,
        chr: { name: '?' },
        start: cc.start,
        end: cc.end,
        landmark: lcc.landmark,
        alignOn: config.ZoomRegion.featureAlignment
      }])
    } else if (cr.length > 0) {
      // Regions specified explicitly. Nothing to compute except the layout.
      this.regions = this.layoutRegions(cr.filter(r => r.genome === this.genome), true)
    } else if (lm) {
    } else if (this.genome === this.context.rGenome) {
      // this is the ref genome. Use the context coordinates
      this.regions = this.layoutRegions([{
        genome: this.genome,
        chr: cc.chr,
        start: cc.start,
        end: cc.end
      }])
    } else {
      // Map the reference genome coordinates to region(s) in this genome
      this.busyStart()
      this.translator().translate(this.context.rGenome, cc.chr.name, cc.start, cc.end, this.genome).then(rs => {
        rs.forEach(r => { r.genome = this.genome })
        this.regions = this.layoutRegions(rs)
        this.busyEnd()
      })
    }
  }
}

export default RegionManager
