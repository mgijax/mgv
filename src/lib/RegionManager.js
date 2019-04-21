
import config from '@/config'
import u from '@/lib/utils'
import gc from '@/lib/GenomeCoordinates'

// The RegionManager maintains the set of genomic regions that specify what to display in the ZoomView.
class RegionManager {
  //--------------------------------------
  constructor (app) {
    this.app = app
    this.currRegion = null
    this.app.$root.$on('region-current', r => { this.currRegion = r ? r.region : null })
    this.app.$root.$on('region-change', d => this.regionChange(d))
    this.app.$root.$on('jump-to', d => this.jumpTo(d.coords))
    this.app.$root.$on('feature-align', d => {
      const f = d.feature
      const anchor = d.basePos ? ((d.basePos - f.start + 1) / (f.end - f.start + 1)) : null
      let l
      if (d.region) {
        l = d.region.end - d.region.start + 1
      } else {
        l = 3 * (f.end - f.start + 1)
      }
      const lcoords = {
        landmark: f.symbol || f.cID || f.ID,
        lgenome: f.genome,
        anchor: anchor,
        delta: 0,
        length: l
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
  getRegions (g, c) {
    let rs = this.app.strips.filter(s => s.genome === g).reduce((rs, s) => rs.concat(s.regions), [])
    if (c) {
      rs = rs.filter(r => r.chr === c)
    }
    return rs
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
  addStrip (g, quietly, r) {
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
      regions: [ r || defaultRegion ]
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
  swap (r, quietly) {
    const rr = this.findRegion(r)
    const si = rr[0], ri = rr[1]
    if (ri === -1) return
    const s = this.app.strips[si]
    s.regions.splice(ri, 1)
    s.regions.splice(ri + 1, 0, r)
    this.layout()
    if (!quietly) this.announce()
  }
  //--------------------------------------
  // Moves the border between r1 and its righthand neighbor by the specified amt (in pixels)
  moveBorder (r1, amt, quietly) {
    //
    const _move = function (regions, i, amt, min) {
      const a = regions[i]
      const b = regions[i + 1]
      if (!a || !b) return 0
      
      if (amt > 0) {
        const shove = Math.max(0, amt - (b.width - min))
        if (shove > 0) {
          const shoved = _move(regions, i + 1, shove, min)
          amt -= (shove - shoved)
        }
        a.width += amt
        b.width -= amt
        b.deltaX += amt
        return amt
      } else if (amt < 0) {
        const shove = Math.min(0, amt + (a.width - min))
        if (shove < 0) {
          const shoved = _move(regions, i - 1, shove, min)
          amt -= (shove - shoved)
        }
        a.width += amt
        b.width -= amt
        b.deltaX += amt
        return amt
      } else {
        return 0
      }
    }
    //
    const rr = this.findRegion(r1)
    const si = rr[0], ri = rr[1]
    if (ri === -1) return
    _move(this.app.strips[si].regions, ri, amt, 45)
    if (!quietly) this.announce()
  }
  //--------------------------------------
  addRegion (r) {
    r = Object.assign({}, r)
    const si = this.findStrip(r.genome)
    if (!r.deltaX) r.deltaX = 0
    if (si === -1) {
      r.width = 1
      this.addStrip(r.genome, true, r)
    } else {
      const s = this.app.strips[si]
      r.width = s.regions.length ? s.regions[0].width : 1
      s.regions.push(r)
    }
    this.layout()
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
    const s = this.app.strips[si]
    if (s.regions.length === 1) {
      this.deleteStrip(s.genome, true)
    } else {
      s.regions.splice(ri, 1)
    }
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
  jumpTo (coords, quietly) {
    let strips = this.app.strips
    if (!this.app.scrollLock) {
      const s = this.app.strips.filter(s => s.order === 0)[0] || this.app.strips[0]
      strips = [s]
    }
    strips.forEach(s => {
      const g = s.genome
      const r = s.regions[0]
      if (!r) return
      const cc = gc.validate(coords, g, true)
      if (!cc) return
      s.regions.splice(1, s.regions.length - 1)
      this.setRegion(r, cc)
    })
    this.layout()
    if (!quietly) this.announce()
  }
  //--------------------------------------
  zoom (amt, quietly) {
    this.regionChange({ region: this.currRegion, op: 'zoom', amt: amt }, quietly)
  }
  //--------------------------------------
  scrollAllRegions (amt) {
    this.app.strips.forEach(s => {
      s.regions.forEach(r => this.scrollRegion(r, amt))
    })
  }
  //--------------------------------------
  scrollRegion (r, amt) {
    const delta = amt * (r.end - r.start + 1)
    r.start = Math.floor(r.start + delta)
    r.end = Math.floor(r.end + delta)
  }
  //--------------------------------------
  scroll (amt, quietly) {
    this.regionChange({ region: this.currRegion, op: 'scroll', amt: amt }, quietly)
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
  computeMappedRegions (r, genomes) {
    const promises = (genomes || this.currentGenomes()).map(g => this.mapRegionToGenome(r, g))
    return Promise.all(promises).then(strips => {
      this.app.rRegion = r
      this.app.scrollLock = false
      this.app.lcoords = null
      strips.forEach(s => s.regions.forEach( r => { r.width = r.end - r.start + 1 }))
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
  alignOnLandmark (lcoords, genomes) {
    this.computeLandmarkRegions(lcoords, (genomes || this.currentGenomes())).then(strips => {
      this.app.strips = strips
      this.app.scrollLock = true
      this.app.lcoords = lcoords
      this.app.rRegion = null
    })
  }
  //--------------------------------------
  computeLandmarkRegions (lcoords, genomes) {
    const ps = genomes.map(g => {
      return this.app.dataManager.ensureFeatures(g).then(() => {
        return this.computeLandmarkRegion(lcoords, g)
      })
    })
    return Promise.all(ps).then(strips => this.layout(strips))
  }
  //
  //--------------------------------------
  computeLandmarkRegion (lcoords, genome) {
    // landmark mode
    const delta = lcoords.delta
    const w = lcoords.length
    const alignOn = config.ZoomRegion.featureAlignment
    const lm = this.app.dataManager.getGenolog(lcoords.landmark, genome)
    if (!lm) {
      // Landmark does not exist in this genome! Fallback: first compute the
      // landmark region in the landmark's own genome, then map that region 
      // to this genome.
      const r0 = this.computeLandmarkRegion(lcoords, lcoords.lgenome)
      return this.mapRegionToGenome(r0.regions[0], genome)
    }
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
    strips.forEach(strip => {
      this.layoutStrip(strip, width)
    })
    return strips
  }

  //--------------------------------------
  // 
  layoutStrip (strip, width) {
    //
    width = width || this.app.zoomWidth
    // x-offset in pixels from left side of strip. Init to 12 to skip over endcap.
    let dx = 12
    // Number of pixels between regions 
    const gap = 2
    // total gap space for the strip
    const totalGap = dx + gap * (strip.regions.length - 1)
    // width available for the regions 
    const availWidth = width - totalGap
    const minWidth = 25 // minimum width of a region in pixels
    const widths0 = strip.regions.map(r => r.width || minWidth)
    const widths = this.scaleAdjust(widths0, availWidth, minWidth)
    strip.regions.forEach((r, i) => {
      r.width = widths[i]
      r.length = r.end - r.start + 1
      r.deltaX = dx
      dx += r.width + gap
    })
  }
  //--------------------------------------
  scaleAdjust (nums, width, mWidth) {
    const sum = nums.reduce((t, n) => t + n, 0)
    const f = width / sum
    // Scale the nums, but impose a minimum width.
    // Tally the deficit.
    let deficit = 0
    const scaled = nums.map(n => {
      const n2 = f * n
      if (n2 < mWidth) {
        deficit += (mWidth - n2)
        return mWidth
      } else {
        return n2
      }
    })
    if (deficit === 0) return scaled
    const width2 = width - deficit
    const sum2 = scaled.reduce((t,n) => t + (n > mWidth ? n : 0), 0)
    const f2 = width2 / sum2
    const scaled2 = scaled.map(n => n > mWidth ? n * f2 : n)
    return scaled2
  }
  //--------------------------------------
  // Handler for region-change events
  // Args:
  //  d (object) event data, which includes:
  //    op    Operation. One of: scroll, zoom, remove
  //
  //    Other fields depend on the op.
  //    delta (When op = scroll) Amount to scroll.
  //    coords (When op = set) New coordinates to use.
  //    amt (When op = zoom) Zoom factor 
  //    pos (when op = split) Position of the split. (0..1)
  //
  regionChange (d, quietly) {
    const r = d.region
    if (d.op === 'scroll') {
      if (this.app.scrollLock) {
        this.scrollAllRegions(d.amt)
      } else if (r === this.app.rRegion) {
        this.scrollRegion(r, d.amt)
        this.computeMappedRegions(r)
      } else {
        this.scrollRegion(r, d.amt)
      }
    } else if (d.op === 'zoom') {
      if (r === this.app.rRegion) {
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
      this.deleteStrip(r.genome)
    } else if (d.op === 'new') {
      this.addRegion(d.region)
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
