
import config from '@/config'
import u from '@/lib/utils'

// The RegionManager maintains the set of genomic regions that specify what to display in the ZoomView.
class RegionManager {
  //--------------------------------------
  constructor (app) {
    this.app = app
    this.currRegion = null
    this.app.$root.$on('region-current', r => { this.currRegion = r })
    this.app.$root.$on('region-change', d => this.regionChange(d))
    this.app.$root.$on('resize', () => this.layout())
    this.app.$root.$on('feature-align', d => {
      const f = d.feature
      const r = d.vm.region
      const lcoords = {
        landmark: f.symbol || f.cID || f.ID,
        anchor: d.basePos ? ((d.basePos - f.start + 1) / (f.end - f.start + 1)) : null,
        delta: 0,
        length: r.end - r.start + 1
      }
      this.alignOnLandmark(lcoords)
    })
  }
  //--------------------------------------
  // Returns the index of the strip for genome g, or -1 if no such strip exists.
  findStrip (g) {
    return this.app.strips.map(s => s.genome).indexOf(g)
  }
  //--------------------------------------
  // Returns the index of the specified region along with the index of the strip it was found in.
  // 
  findRegion (r) {
    const i = this.findStrip(r.genome)
    const j = (i === -1 ? -1 : this.app.strips[i].regions.indexOf(r))
    return [i, j]
  }
  //--------------------------------------
  //
  currentGenomes () {
    return u.removeDups(this.app.strips.map(s => s.genome))
  }
  //--------------------------------------
  //
  setStrips (genomes, quietly) {
   const current = this.app.strips.map(s => s.genome)
   const curset = new Set(current)
   const newset = new Set(genomes)
   const toRemove = current.filter(g => !newset.has(g))
   const toAdd = genomes.filter(g => !curset.has(g))
   toRemove.forEach(g => this.deleteStrip(g, true))
   toAdd.forEach(g => this.addStrip(g, true))
   this.layout()
   if (!quietly) this.announce()
  }

  //--------------------------------------
  // Add a strip to the display for genome g.
  addStrip (g, quietly) {
    const chr = g.chromosomes[0]
    const defaultRegion = {
      genome: g,
      chr: chr,
      start: 1,
      end: Math.min(10000000, chr.length),
      width: 1 // value doesn't matter here
    }
    const strip = {
      genome: g,
      regions: [ defaultRegion ]
    }
    this.app.strips.push(strip)
    this.layout()
    if (!quietly) this.announce()
    return strip
  }
  //--------------------------------------
  //
  deleteStrip (g, quietly) {
    const i = this.findStrip(g)
    if (i >= 0) {
      const rr = this.app.rRegion
      if (this.app.strips[i].regions.indexOf(rr) !== -1) {
        this.app.rRegion = null
      }
      this.app.strips.splice(i, 1)
      if (!quietly) this.announce()
    }
  }
  //--------------------------------------
  // Moves the border between r1 and its righthand neighbor by the specified amt (in pixels)
  moveBorder (r1, amt, quietly) {
    const rr = this.findRegion(r1)
    const si = rr[0], ri = rr[1]
    if (ri === -1) return
    const r2 = this.app.strips[si].regions[ri + 1]
    if (!r2) return
    r1.width += amt
    r2.width -= amt
    r2.deltaX += amt
    if (!quietly) this.announce()
  }
  //--------------------------------------
  setRegion(r, coords) {
    const rr = this.findRegion(r)
    if (rr[1] === -1) return
    if (r.chr !== coords.chr) r.chr = coords.chr
    if (r.start !== coords.start) r.start = Math.floor(coords.start)
    if (r.end !== coords.end) r.end = Math.floor(coords.end)
  }
  //--------------------------------------
  removeRegion (r) {
    const rr = this.findRegion(r)
    const si = rr[0], ri = rr[1]
    if (ri === -1) return
    this.app.strips[si].regions.splice(ri, 1)
    this.layout()
  }
  //--------------------------------------
  zoomAllRegions (amt) {
    this.app.strips.forEach(s => {
      s.regions.forEach(r => this.zoomRegion(r, amt))
    })
  }
  //--------------------------------------
  zoomRegion (r, amt) {
    amt = amt || 2
    const mid = (r.start + r.end) / 2
    const len = r.end - r.start + 1
    const newlen = Math.round(len / amt)
    const newstart = Math.floor(mid - newlen / 2)
    const newend = newstart + newlen - 1
    r.start = newstart
    r.end = newend
  }
  //--------------------------------------
  zoom (amt, quietly) {
    this.regionChange({ vm: this.currRegion, op: 'zoom', amt: amt }, quietly)
  }
  //--------------------------------------
  scrollAllRegions (delta) {
    this.app.strips.forEach(s => {
      s.regions.forEach(r => this.scrollRegion(r, delta))
    })
  }
  //--------------------------------------
  scrollRegion (r, delta) {
    if (Math.abs(delta) <= 1) {
      delta = delta * (r.end - r.start + 1)
    }
    r.start = Math.floor(r.start + delta)
    r.end = Math.floor(r.end + delta)
  }
  //--------------------------------------
  splitRegion (r, frac) {
    const rr = this.findRegion(r)
    const si = rr[0], ri = rr[1]
    if (ri === -1) return
    const r2 = Object.assign({}, r)
    const w = r.width
    const l = r.end - r.start + 1
    const ll = Math.floor(frac * l)

    r.width = frac * w
    r.end = r.start + ll - 1
    r2.width = (1 - frac) * w
    r2.start = r.start + ll
    this.app.strips[si].regions.splice(ri + 1, 0, r2)
    this.layout()
  }
  //--------------------------------------
  // Designates the specified region as the reference. The region's genome becomes the reference genome.
  // Other genomes' regions are recalculated based on synteny blocks.
  //
  // Maps a given region (genome+chr+start+end) to the equivalent regions in the given list of genomes
  // Returns a promise for the list of strips
  computeMappedRegions (r) {
    const promises = this.currentGenomes().map(g => this.mapRegionToGenome(r, g))
    return Promise.all(promises).then(strips => {
      this.app.rRegion = r
      this.app.lockstep = false
      this.app.lcoords = null
      this.app.strips = this.layout(strips)
    })
  }
  //--------------------------------------
  // Maps a reference region r to genome g. Returns a promise for a strip.
  mapRegionToGenome (r, g) {
    if (r.genome === g) {
      return Promise.resolve({
        genome : g,
        regions: [r]
      })
    }
    const tr = this.app.translator
    return tr.translate(r.genome, r.chr.name, r.start, r.end, g).then(rs => {
      rs.forEach(rr => { rr.genome = g })
      return {
        genome: g,
        regions: this.combineRegions(rs)
      }
    })
  }
  //--------------------------------------
  // Combine regions whose indexes form a sequence
  // Only applies to computed (mapped) regions.
  combineRegions (regions) {
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
  //--------------------------------------
  alignOnLandmark (lcoords) {
    this.computeLandmarkRegions(lcoords, this.currentGenomes()).then(strips => {
      this.app.strips = strips
      this.app.lockstep = true
      this.app.lcoords = lcoords
      this.app.rRegion = null
    })
  }
  //--------------------------------------
  computeLandmarkRegions (lcoords, genomes) {
    const p = Promise.all(genomes.map(g => this.app.dataManager.ensureFeatures(g)))
    return p.then(() => genomes.map(g => this.computeLandmarkRegion(lcoords, g))).then(strips => this.layout(strips))
  }
  //
  //--------------------------------------
  computeLandmarkRegion (lcoords, genome) {
    // landmark mode
    const delta = lcoords.delta
    const w = lcoords.length
    const alignOn = config.ZoomRegion.featureAlignment
    const lm = this.app.dataManager.getGenolog(lcoords.landmark, genome)
    let lmp
    if (typeof(lcoords.anchor) === 'number') {
      lmp = lm.start + lcoords.anchor * (lm.end - lm.start + 1)
    } else {
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
      default:
        lmp = Math.floor((lm.start + lm.end) / 2)
        break
      }
    }
    const s = Math.round(lmp - w / 2) + delta
    return {
      genome: genome,
      regions: [{
        genome: genome,
        chr: lm.chr,
        start: s,
        end: s + w - 1,
      }]
    }
  }
  //--------------------------------------
  //
  layout (strips, width) {
    strips = strips || this.app.strips
    width = width || this.app.zoomWidth
    strips.forEach(strip => {
      this.layoutStrip(strip, width)
    })
    return strips
  }

  //--------------------------------------
  // 
  layoutStrip (strip, width) {
    // x-offset in pixels from left side of strip. Init to 12 to skip over endcap.
    let dx = 12
    // Number of pixels between regions 
    let gap = 2
    // total gap space for the strip
    let totalGap = dx + gap * (strip.regions.length - 1)
    // width available for the regions 
    let availWidth = width - totalGap

    // total length in bp of the regions
    let totalLength = 0
    // total width
    let totalWidth = 0
    //
    let wcount = 0
    let no_wcount = 0
    let minWidth = 45 // minimum width of a region in pixels

    // Compute normalized widths. First count widths and region lengths
    strip.regions.forEach(r => {
      const l = r.end - r.start + 1
      if(l !== r.length) r.length = l   // set length if needed
      totalLength += l
      if (r.width) {
        totalWidth += r.width
        wcount += 1
      } else {
        no_wcount += 1
      }
    })
    totalWidth += (minWidth * no_wcount)

    // scale all widths
    strip.regions.forEach(r=> {
      const w = availWidth * ((r.width || minWidth) / totalWidth)
      if (w !== r.width) r.width = w
      if(dx !== r.delta) r.deltaX = dx
      dx += r.width + gap
    })
  }
  //--------------------------------------
  // Handler for region-change events
  // Args:
  //  d (object) event data, which includes:
  //    vm    The ZoomRegion component
  //    op    Operation. One of: scroll, zoom, remove
  //
  //    Other fields depend on the op.
  //    delta (When op = scroll) Amount to scroll.
  //    coords (When op = set) New coordinates to use.
  //    amt (When op = zoom) Zoom factor 
  //    pos (when op = split) Position of the split. (0..1)
  //
  regionChange (d, quietly) {
    const r = d.vm.region
    if (d.op === 'scroll') {
      if (this.app.lockstep) {
        this.scrollAllRegions(d.delta)
      } else if (r === this.app.rRegion) {
        this.scrollRegion(r, d.delta)
        this.computeMappedRegions(r)
      } else {
        this.scrollRegion(r, d.delta)
      }
    } else if (d.op === 'zoom') {
      if (this.app.lockstep) {
        this.zoomAllRegions(d.amt)
      } else if (r === this.app.rRegion) {
        this.zoomRegion(r, d.amt)
        this.computeMappedRegions(r)
      } else {
        this.zoomRegion(r, d.amt)
      }
    } else if (d.op === 'set') {
      this.setRegion(r, d.coords)
      if (r === this.app.rRegion) {
        this.computeMappedRegions(r)
      }
    } else if (d.op === 'remove') {
      if (r === this.app.rRegion) this.app.rRegion = null
      this.removeRegion(r)
    } else if (d.op === "split") {
      if (r === this.app.rRegion) this.app.rRegion = null
      this.splitRegion(r, d.pos)
    } else if (d.op === "make-reference") {
      this.computeMappedRegions(r)
    } else if (d.op === 'delete-strip') {
      this.deleteStrip(d.vm.genome)
    }
    if (!quietly) this.announce()
  }
  //--------------------------------------
  //
  announce () {
    this.app.$root.$emit('context-changed')
  }
  //--------------------------------------
  //
  getParameterString () {
    let parms
    const app = this.app
    const strips = app.strips.concat()
    strips.sort((a,b) => a.order - b.order)
    const rs = strips.map(s => {
      const rs = s.regions.map(r => `${r.chr.name}:${r.start}..${r.end}/${Math.floor(r.width)}`).join(',')
      return `${s.genome.name}::${rs}`
    }).join('|')
    parms = [
      `regions=${rs}`
    ]
    return parms.join('&')
  }
}

export default RegionManager
