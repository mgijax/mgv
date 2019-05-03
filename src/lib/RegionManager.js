
import config from '@/config'
import u from '@/lib/utils'
import gc from '@/lib/GenomeCoordinates'

// The RegionManager maintains the set of genomic regions that specify what to display in the ZoomView.
class RegionManager {
  //--------------------------------------
  constructor (app) {
    this.app = app
    this.currRegion = null
    this.rCount = 0
    //
    this.app.$root.$on('region-current', r => { if (r) this.currRegion = r.region })
    this.app.$root.$on('region-change', d => this.regionChange(d))
    this.app.$root.$on('jump-to', d => this.jumpTo(d.coords))
    this.app.$root.$on('feature-align', d => this.featureAlign(d))
  }
  //--------------------------------------
  makeRegion (r) {
    const rr = r ? Object.assign({}, r) : {}
    rr.id = this.rCount++
    rr.width = rr.width === undefined ? 1 : rr.width
    rr.deltaX = rr.deltaX === undefined ? 0 : rr.deltaX
    return rr
  }
  //--------------------------------------
  // Returns the index of the strip for genome g, or -1 if no such strip exists.
  findStrip (g) {
    return this.app.strips.map(s => s.genome).indexOf(g)
  }
  //--------------------------------------
  // Returns the index of the specified region along with the 
  // index of the strip it was found in.
  // Returns:
  //  [si, ri] where si is the index of the strip containing r, and ri is
  //  the index of r within the strip
  findRegion (r) {
    const i = this.findStrip(r.genome)
    const j = (i === -1 ? -1 : this.app.strips[i].regions.indexOf(r))
    return [i, j]
  }
  //--------------------------------------
  // Returns the current regions that are for genome g on chromosome c.
  getRegions (g, c) {
    let rs = this.app.strips.filter(s => s.genome === g).reduce((rs, s) => rs.concat(s.regions), [])
    if (c) {
      rs = rs.filter(r => r.chr === c)
    }
    return rs
  }
  //--------------------------------------
  // Returns the unique genomes from all regions.
  currentGenomes () {
    return u.removeDups(this.app.strips.map(s => s.genome))
  }
  //--------------------------------------
  // Sets the strips to be for the given list of genomes.
  // Removes strips for genomes not in the list,
  // adds strips (if needed) for those that are.
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
  // Removes the strip for genome g.
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
  // Swaps the positions of r and its righthand neighbor.
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
  // Moves the border between r1 and its righthand neighbor by the specified amt (in pixels).
  // Preserves a minimum region width.
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
    _move(this.app.strips[si].regions, ri, amt, 25)
    if (!quietly) this.announce()
  }
  //--------------------------------------
  initializeRegions (strips) {
    strips.forEach(s => {
      s.regions = s.regions.map(r => this.makeRegion(r))
    })
    this.mergeUpdate(strips)
    this.layout()
  }
  //--------------------------------------
  // Adds a new region. Adds a new strip if necessary, or adds r to the
  // end of existing strip, based on r's genome.
  addRegion (r) {
    r = this.makeRegion(r)
    const si = this.findStrip(r.genome)
    if (si === -1) {
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
  // Zooms and scrolls the given region by the specified amounts
  // Args:
  //  r - the region to update
  //  zAmt - zoom amount. Multiplied by region length to determine new region length
  //  sAmt - scroll amount. Multiplied with the region length to determine direction and distance of scroll.
  zoomScrollRegion (r, zAmt, sAmt) {
    if (zAmt <= 0) u.fail("Bad parameter: zoom factor must be > 0")
    const L = r.end - r.start + 1
    const L2 = zAmt * L
    const delta = sAmt * Math.max(L, L2)
    const mid = (r.start + r.end) / 2
    const s2 = Math.floor(mid - L2 / 2 + delta + 1)
    const e2 = Math.floor(s2 + L2 - 1)
    r.start = s2
    r.end = e2
    return r
  }
  //--------------------------------------
  zoomScrollAllRegions (zAmt, sAmt) {
    this.app.strips.forEach(s => {
      s.regions.forEach(r => this.zoomScrollRegion(r, zAmt, sAmt))
    })
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
  splitRegion (r, frac) {
    const rr = this.findRegion(r)
    const si = rr[0], ri = rr[1]
    if (ri === -1) return
    const r2 = this.makeRegion(r)
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
      strips.forEach(s => {
        s.regions.forEach(r => { r.width = r.end - r.start + 1 })
        s.regions = s.regions.map(r => this.makeRegion(r))
      })
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
  //--------------------------------------
  featureAlign (d, quietly) {
    const f = d.feature
    const anchor = d.basePos ? ((d.basePos - f.start + 1) / (f.end - f.start + 1)) : null
    let l
    if (d.region) {
      l = d.region.end - d.region.start + 1
    } else {
      l = 3 * (f.end - f.start + 1)
    }
    const lcoords = {
      landmark: f.cID || f.ID,
      lgenome: f.genome,
      anchor: anchor,
      delta: 0,
      length: l
    }
    this.alignOnLandmark(lcoords, quietly)
  }
  //--------------------------------------
  alignOnLandmark (lcoords, genomes, quietly) {
    this.computeLandmarkRegions(lcoords, (genomes || this.currentGenomes())).then(strips => {
      this.mergeUpdate(strips)
      this.layout()
      this.app.scrollLock = true
      this.app.lcoords = lcoords
      this.app.rRegion = null
      this.app.currentSelection = [lcoords.landmark]
      if (!quietly) this.announce()
    })
  }
  //--------------------------------------
  mergeUpdate (strips) {
    u.mergeArrays(this.app.strips, strips, (a,b) => this.mergeStrip(a,b))
  }
  //--------------------------------------
  mergeStrip (s1, s2) {
    if (s1.genome !== s2.genome) s1.genome = s2.genome
    u.mergeArrays(s1.regions, s2.regions, (r1, r2) => this.mergeRegion(r1, r2))
  }
  //--------------------------------------
  mergeRegion (r1, r2) {
    if (r1.chr !== r2.chr) r1.chr = r2.chr
    if (r1.genome !== r2.genome) r1.genome = r2.genome
    r1.start = r2.start
    r1.end = r2.end
  }
  //--------------------------------------
  computeLandmarkRegions (lcoords, genomes) {
    const ps = genomes.map(g => {
      return this.app.dataManager.ensureFeatures(g).then(() => {
        return this.computeLandmarkRegion(lcoords, g)
      })
    })
    return Promise.all(ps)
  }
  //
  //--------------------------------------
  computeLandmarkRegion (lcoords, genome) {
    // landmark mode
    const delta = lcoords.delta
    const w = lcoords.length
    const alignOn = config.ZoomRegion.featureAlignment
    const lms = this.app.dataManager.getGenologs(lcoords.landmark, [genome]).filter(x => x)
    if (lms.length === 0) {
      // Landmark does not exist in this genome! Fallback: first compute the
      // landmark region in the landmark's own genome, then map that region 
      // to this genome.
      const r0 = this.computeLandmarkRegion(lcoords, lcoords.lgenome)
      return this.mapRegionToGenome(r0.regions[0], genome)
    }
    const regions = lms.map(lm => {
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
      return this.makeRegion({
        genome: genome,
        chr: lm.chr,
        start: s,
        end: s + w - 1,
      })
    })
    return {
      genome: genome,
      regions: regions
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
    const sum2 = scaled.reduce((t,n) => t + (n > mWidth ? n : 0), 0)
    const scaled2 = scaled.map(n => n - deficit * (n > mWidth ? n / sum2 : 0))
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
    const r = d.region || this.currRegion || this.app.strips[0].regions[0]
    if (d.op === 'scroll') {
      if (this.app.scrollLock) {
        this.zoomScrollAllRegions(1, d.amt)
      } else if (r === this.app.rRegion) {
        this.zoomScrollRegion(r, 1, d.amt)
        this.computeMappedRegions(r)
      } else {
        this.zoomScrollRegion(r, 1, d.amt)
      }
    } else if (d.op === 'zoom') {
      if (this.app.scrollLock) {
        this.zoomScrollAllRegions(d.amt, 0)
      } else if (r === this.app.rRegion) {
        this.zoomScrollRegion(r, d.amt, 0)
        this.computeMappedRegions(r)
      } else {
        this.zoomScrollRegion(r, d.amt, 0)
      }
    } else if (d.op === 'zoomscroll') {
      const zAmt = d.out ? 1 / d.plength : d.plength
      const sAmt = (d.pstart - 0.5 + d.plength / 2) * (d.out ? -1 : 1)
      if (this.app.scrollLock) {
        this.zoomScrollAllRegions(zAmt, sAmt)
      } else if (r === this.app.rRegion) {
        this.zoomScrollRegion(d.region, zAmt, sAmt)
        this.computeMappedRegions(r)
      } else {
        this.zoomScrollRegion(d.region, zAmt, sAmt)
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
