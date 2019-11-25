//
// RegionManager - central point of control for creating/updating the model data that
// drives the main display.
//`
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
    this.app.$root.$on('region-current', r => {
      if (r) this.currRegion = r.region
    })
    //
    this.app.$root.$on('region-change', d => {
      this.regionChange(d)
    })
  }
  //--------------------------------------
  makeRegion (r) {
    const rr = r ? Object.assign({}, r) : {}
    rr.id = this.rCount++
    rr.width = rr.width === undefined ? 1 : rr.width
    rr.deltaX = rr.deltaX === undefined ? 0 : rr.deltaX
    if (!('reversed' in rr)) rr.reversed = false
    return rr
  }
  //--------------------------------------
  setRefGenome (g) {
    this.app.rGenome = g
    this.app.scrollLock = false
  }
  //--------------------------------------
  clearRefGenome () {
    this.app.rGenome = null
  }
  //--------------------------------------
  setLockMode () {
    this.app.scrollLock = true
    this.app.rGenome = null
  }
  clearLockMode () {
    this.app.scrollLock = false
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
  // Returns a promise that resolves when the strips have been set.
  setStrips (genomes, quietly) {
   const current = this.app.strips.map(s => s.genome)
   const curset = new Set(current)
   const newset = new Set(genomes)
   const toRemove = current.filter(g => !newset.has(g))
   const toAdd = genomes.filter(g => !curset.has(g))
   toRemove.forEach(g => this.deleteStrip(g))
   return Promise.all(toAdd.map(g => this.addStrip(g))).then(() => {
     this.layout()
     if (!quietly) this.announce()
   })
  }

  //--------------------------------------
  // Add a strip to the display for genome g. 
  addStrip (g, r) {
    let p
    if (this.app.lcoords && this.app.lcoords.landmark) {
      p = this.computeLandmarkRegions(this.app.lcoords, [g]).then(strips => strips[0])
    } else if (this.app.rGenome && this.app.rStrip) {
      p = this.mapRegionsToGenome(this.app.rStrip.regions, g)
    } else if (this.app.strips.length) {
      p = this.mapRegionsToGenome(this.app.strips[0].regions, g)
    } else {
      const chr = g.chromosomes[0]
      p = Promise.resolve({
        genome: g,
        regions: [{
          genome: g,
          chr: chr,
          start: 1,
          end: Math.min(10000000, chr.length),
          width: 1 // value doesn't matter here
          }]
      })
    }
    return p.then(strip => {
      strip.regions.forEach(r => r.width = r.end - r.start + 1)
      this.app.strips.push(this.layoutStrip(strip))
      return strip
    })
  }
  //--------------------------------------
  // Removes the strip for genome g.
  deleteStrip (g) {
    const i = this.findStrip(g)
    if (i >= 0) {
      // if strip is the reference genome, set it to null
      if (this.app.rGenome === g) {
        this.clearRefGenome()
      }
      this.app.strips.splice(i, 1)
      // this.app.dataManager.flushGenome(g)
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
    return Promise.resolve(true)
  }
  //--------------------------------------
  // Adds a new region. Adds a new strip if necessary, or adds r to the
  // end of existing strip, based on r's genome.
  addRegion (r, only) {
    r = this.makeRegion(r)
    const si = this.findStrip(r.genome)
    if (si === -1) {
      this.addStrip(r.genome, r).then(this.layout())
    } else {
      const s = this.app.strips[si]
      r.width = s.regions.length ? s.regions[0].width : 1
      if (only) {
        s.regions = [r]
      } else {
        s.regions.push(r)
      }
      this.layout()
    }
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
  removeRegion (r, allBut) {
    const rr = this.findRegion(r)
    const si = rr[0], ri = rr[1]
    if (ri === -1) return
    const s = this.app.strips[si]
    if (allBut) {
      s.regions = [r]
    } else if (s.regions.length === 1) {
      this.deleteStrip(s.genome)
    } else {
      s.regions.splice(ri, 1)
    }
    this.layout()
  }
  //--------------------------------------
  removeAllBut (r) {
    this.removeRegion(r, true)
  }
  //--------------------------------------
  zoomRegion (r, zAmt) {
    const L = r.end - r.start + 1
    const L2 = Math.round(zAmt * L)
    const mp = (r.start + r.end) / 2
    r.start = Math.round(mp - L2 / 2)
    r.end = r.start + L2 - 1
  }
  //--------------------------------------
  scrollRegion (r, sAmt, sType) {
    const sPix = (!sType || sType === "px" ? sAmt : sAmt * r.width)
    const rL = r.end - r.start + 1
    const rPpb = r.width / rL
    const sBp = sPix / rPpb * (r.reversed ? -1 : 1)
    r.start -= sBp
    r.end -= sBp
  }
  //--------------------------------------
  // Zooms and scrolls the given region by the specified amounts
  // Args:
  //  r - the region to update
  //  zAmt - zoom amount. Multiplied by region length to determine new region length
  //  sAmt - scroll amount
  //  sType - the scroll amount (sAmt) may be specified either in pixels or as a fraction.
  //          If sType is unspecified or 'px', sAmt is in pixels.
  //          If sType is '%', then sAmt is a fraction (sorry, not technically a percentage!)
  zoomScrollRegion (r, zAmt, sAmt, sType) {
    if (zAmt <= 1) {
      this.scrollRegion(r, sAmt, sType)
      this.zoomRegion(r, zAmt)
    } else {
      this.zoomRegion(r, zAmt)
      this.scrollRegion(r, sAmt, sType)
    }
  }
  //--------------------------------------
  zoomScrollAllRegions (zAmt, sAmt, sType) {
    this.app.strips.forEach(s => {
      s.regions.forEach(r => this.zoomScrollRegion(r, zAmt, sAmt, sType))
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
  }
  //--------------------------------------
  reverseRegion (r, value) {
    if (value === undefined) {
      r.reversed = !r.reversed
    } else {
      r.reversed = value
    }
  }
  //--------------------------------------
  splitRegion (r, frac) {
    const rr = this.findRegion(r)
    const si = rr[0], ri = rr[1]
    if (ri === -1) return
    //
    const r2 = this.makeRegion(r)
    const w = r.width
    const l = r.end - r.start + 1
    const ll = Math.floor(frac * l)
    //
    r.width = frac * w
    r2.width = (1 - frac) * w
    if (r.reversed) {
      r.start = r.end - ll + 1
      r2.end -= ll
    } else {
      r.end = r.start + ll - 1
      r2.start = r.start + ll
    }
    r.length = r.end - r.start + 1
    r2.length = r2.end - r2.start + 1
    this.app.strips[si].regions.splice(ri + 1, 0, r2)
    this.layout()
  }
  //--------------------------------------
  joinRegion (r) {
    const rr = this.findRegion(r)
    const si = rr[0], ri = rr[1]
    if (ri === -1) return
    const s = this.app.strips[si]
    const r2 = s.regions[ri + 1]
    if (r.chr !== r2.chr) {
      alert ("Cannot join regions because they have different chromosomes.")
      return
    }
    r.start = Math.min(r.start, r2.start)
    r.end = Math.max(r.end, r2.end)
    r.length = r.end - r.start + 1
    r.width += r2.width
    s.regions.splice(ri+1, 1)
    this.layout()
  }
  //--------------------------------------
  //
  mergeRegions (g, regions) {
    const rs = regions.reduce((newRs, r) => {
      let merged = false
      for (let i = 0; i < newRs.length; i++) {
        const r0 = newRs[i]
        const db = gc.distanceBetween(r0, r)
        const tlen = r0.length + r.length
        if (db < 1000000) {
          r0.start = Math.min(r0.start, r.start)
          r0.end = Math.max(r0.end, r.end)
          r0.length = r0.end - r0.start + 1
          merged = true
          break
        }
      }
      !merged && newRs.push(r)
      return newRs
    }, [])
    return rs
  }
  //--------------------------------------
  initMappedRegions (ref, coords, genomes) {
    coords.genome = ref
    const promises = genomes.map(g => {
      return this.mapRegionToGenome(coords, g).then(regions => {
        regions.forEach(r => { r.width = r.length })
        return {
          genome: g,
          regions: regions
        }
      })
    })
    return Promise.all(promises).then(strips => {
      this.mergeUpdate(strips)
      this.layout()
    })
  }
  //--------------------------------------
  // Map the region(s) being shown for the current reference genome to corresponding region(s)
  // in each of the specified genomes
  computeMappedRegions (genomes) {
    genomes = genomes || this.currentGenomes()
    const promises = genomes.map(g => {
      if (g === this.app.rGenome) {
        return Promise.resolve(this.app.rStrip)
      } else {
        return this.mapRegionsToGenome(this.app.rStrip.regions, g)
      }
    })
    return Promise.all(promises).then(strips => {
      this.app.lcoords = null
      strips.forEach(s => {
        if (s.genome !== this.app.rGenome) {
          s.regions = s.regions.map(rr => {
            rr.width = rr.end - rr.start + 1
            return this.makeRegion(rr)
          })
        }
      })
      this.mergeUpdate(strips)
      this.layout()
    })
  }
  //--------------------------------------
  //
  mapRegionsToGenome (ras, gb) {
    const promises = ras.map(ra => this.mapRegionToGenome(ra, gb))
    return Promise.all(promises).then(data => {
      return {
        genome: gb,
        regions: this.mergeRegions(gb, u.flatten(data))
      }
    })
  }
  //--------------------------------------
  // Maps region ra to corresponding region(s) in genome gb, based on homology relationships.
  mapRegionToGenome (ra, gb) {
    const dm = this.app.dataManager
    return dm.ensureFeatures(ra.genome).then(
      () => dm.ensureFeatures(gb)).then(
      () => this.mapRegionToGenomeNow(ra,gb))
  }
  //--------------------------------------
  // Maps region ra to genome gb immediately, ie, assumes genomes have been loaded.
  mapRegionToGenomeNow (ra, gb) {
    const dm = this.app.dataManager
    // features from the A region
    const afeats = dm.getAllFeaturesNow(ra.genome, ra.chr).filter(f => gc.overlaps(f, ra))
    //  homologs of the A features
    const bfeats = afeats.reduce((abpairs, a) => {
      const blist = dm.getHomologs(a, [gb])
      blist.forEach(b => b && abpairs.push([a,b]))
      return abpairs
    }, [])
    //
    if (bfeats.length === 0) {
      const ra2 = Object.assign({}, ra)
      const w = ra.end - ra.start + 1
      if (w < ra.chr.length) {
        ra2.start -= w
        ra2.end += w
        return this.mapRegionToGenomeNow (ra2, gb)
      }
    }
    //
    const bfeatsClipped = bfeats.map(abf => {
      const af = abf[0]
      const bf = abf[1]
      const inverted = af.strand !== bf.strand
      // If the A feature is only partly contained by the A region, then need to adjust
      // the mapped B feature coordinates accordingly.
      let bfs = bf.start
      let bfe = bf.end
      if (ra.start > af.start) {
        const ps = (ra.start - af.start) / af.length
        const delta = ps * bf.length
        if (inverted) {
          bfe = Math.round(bfe - delta)
        } else {
          bfs = Math.round(bfs + delta)
        }
      }
      if (ra.end < af.end) {
        const pe = (af.end - ra.end) / af.length
        const delta = pe * bf.length
        if (inverted) {
          bfs = Math.round(bfs + delta)
        } else {
          bfe = Math.round(bfe - delta)
        }
      }
      return {
        genome: bf.genome,
        chr: bf.chr,
        start: bfs,
        end: bfe,
        length: bfe - bfs + 1,
        strand: bf.strand
      }
    })
    // Ok, we've mapped each A feature to (the possibly clipped coordinates of) its B homolog
    // Now compute region(s) that contain them all
    const rbs = []
    // For each B feature, find a region that it overlaps or is within a max distance (1Mb) 
    // and add B to it. Otherwise start a new region with that feature.
    bfeatsClipped.forEach(fb => {
      let found = false // have we found a place for fb?
      if (rbs.length) {
        for(let rbi = 0 ; rbi < rbs.length ; rbi++) {
          const rb = rbs[rbi]
          if (rb.chr !== fb.chr) continue
          const rblen = rb.end - rb.start + 1
          const s = Math.min(rb.start, fb.start)
          const e = Math.max(rb.end, fb.end)
          const l = e - s + 1
          if (gc.overlaps(fb, rb) || (l - rblen - fb.length < 1000000)) {
            rb.start = s
            rb.end = e
            rb.length = e - s + 1
            found = true
            break
          }
        }
      }
      if (!found) {
        const delta = Math.round(fb.length / 3)
        rbs.push(this.makeRegion({
          genome: gb,
          chr: fb.chr,
          start: fb.start - delta,
          end: fb.end + delta,
          length: fb.end - fb.start + 1 + 2*delta
        }))
      }
    })
    if (rbs.length === 0) {
      // Could not map the region - no homologs found.
      // Have a flower instead...
      rbs.push(this.makeRegion({
        genome: gb,
        chr: gb.chromosomes[0],
        start: 1,
        end: Math.min(10000000, gb.chromosomes[0].length)
      }))
    } else {
      // One the assumption that region boundaries coincide with feature boundaries,
      // add a little space to each end.
      rbs.forEach(r => {
        const len = r.end - r.start + 1
        const margin = Math.round(len * 0.05)
        r.start -= margin
        r.end += margin
      })
    }
    return rbs
  }
  //--------------------------------------
  featureAlign (d) {
    const f = d.feature
    if (d.event && d.event.shiftKey) {
       this.app.currentSelection.push(f)
    } else {
       this.app.currentSelection = [f]
    }
    const anchor = d.basePos ? ((d.basePos - f.start + 1) / (f.end - f.start + 1)) : null
    let l
    if (d.region) {
      l = d.region.end - d.region.start + 1
    } else {
      l = 3 * (f.end - f.start + 1)
    }
    const lcoords = {
      landmark: f.cID || f.ID,
      lfeature: f,
      lgenome: f.genome,
      anchor: anchor,
      delta: 0,
      length: l
    }
    return this.alignOnLandmark(lcoords)
  }
  //--------------------------------------
  // High level call for lining up on a landmark. Computes the regions, does the update, sets the scroll lock,
  // and announces context change. 
  alignOnLandmark (lcoords, genomes) {
    this.setLockMode()
    genomes = genomes || this.currentGenomes()
    return this.computeLandmarkRegions(lcoords, genomes).then(strips => {
      this.mergeUpdate(strips)
      this.layout()
    })
  }
  //--------------------------------------
  // Returns a promise for regions around the specified landmark in the specified geneoms.
  // The promise resolves to a list of strips, each of which has a list of regions.
  // It is possible for there to be multiple copies of a landmark in a genome leading 
  // to multiple regions in that strip.
  // It is also possible for there to be no landmark in a genome, in which case mapped
  // region(s) are computed.
  computeLandmarkRegions (lcoords, genomes) {
    // ensure the landmark genome has been loaded
    return this.app.dataManager.ensureFeatures(lcoords.lgenome).then(() => {
      // for each target genome
      const ps = genomes.map(g => {
        // ensure that genome has been loaded
        return this.app.dataManager.ensureFeatures(g).then(() => {
          // compute the landmark region in the target genome
          const lmr = this.computeLandmarkRegion(lcoords, g)
          if (lmr) return lmr
          // landmark does not exist in target genome.
          // Try mapping the region instead
          const mr = this.mapLandmarkRegion(lcoords, g)
          return mr
        })
      })
      return Promise.all(ps)
    })
  }
  //
  //--------------------------------------
  // Computes the region(s) around the given landmark in the given genome.
  // Assumes the genome has been loaded!
  // Args:
  //    lcoords (object) the landmark specification. Contains:
  //        landmark (string) name of the landmark
  //        length (number) size in bp around the landmark
  //        delta (number) amount to shift the view from the landmark
  //        lgenome (object) the genome where the landmark was selected
  //        anchor (number from 0 to 1) Defines reference point on the landmark
  //            to align to. Number specifies relative position, from 
  //            start coordinate (0) to end coordinate (1).
  //    genome (object) the genome for which to compute the coordinates
  computeLandmarkRegion (lcoords, genome) {
    const delta = lcoords.delta
    const w = lcoords.length
    const alignOn = config.ZoomRegion.featureAlignment
    const lms = this.app.dataManager.getHomologs(lcoords.landmark, [genome])
    //
    if (lms.length === 0) {
      return null
    }
    const regions = lms.map(lm => {
      const ll = lm.end - lm.start + 1
      const hasFlank = typeof(lcoords.flank) === 'number'
      const lw = hasFlank ? ll + 2*lcoords.flank : w
      let lmp
      if (typeof(lcoords.anchor) === 'number') {
        lmp = lm.start + lcoords.anchor * (lm.end - lm.start + 1)
      } else {
        lmp = Math.floor((lm.start + lm.end) / 2)
      }
      const s = hasFlank ? lm.start - lcoords.flank : Math.round(lmp - lw / 2) + delta
      return this.makeRegion({
        genome: genome,
        chr: lm.chr,
        start: s,
        end: s + lw - 1,
      })
    })
    return {
      genome: genome,
      regions: this.mergeRegions(genome, regions)
    }
  }
  //--------------------------------------
  // When a landmark does not exist in a given genome, use mapping as a fallback.
  // 
  mapLandmarkRegion (lcoords, genome) {
      const dm = this.app.dataManager
      // FIXME: picking arbitrary one...
      const lmf = dm.getHomologs(lcoords.lfeature, lcoords.lgenome)[0]
      const mp = (lmf.start + lmf.end) / 2
      const s = Math.round(mp - lcoords.length / 2)
      const e = s + lcoords.length - 1
      const lmr = {
        genome: lcoords.lgenome,
        chr: lmf.chr,
        start: s,
        end: e
      }
      return {
        genome: genome,
        regions: this.mapRegionToGenomeNow(lmr, genome)
      }
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
    r1.width = r2.width
    r1.reversed = r2.reversed
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
    const gap = 5
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
    return strip
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
  regionChange (d) {
    //
    this.app.logEvent("Navigate", d.op)
    //
    const r = d.region ||
      this.currRegion ||
      (this.app.rStrip && this.app.rStrip.regions[0]) ||
      (this.app.strips[0] && this.app.strips[0].regions[0]) ||
      null
    //
    if (d.op === 'scroll') {
      if (this.app.scrollLock) {
        this.zoomScrollAllRegions(1, d.amt, d.sType)
      } else {
        this.zoomScrollRegion(r, 1, d.amt, d.sType)
      }
    } else if (d.op === 'zoom') {
      if (this.app.scrollLock) {
        this.zoomScrollAllRegions(d.amt, 0)
      } else {
        this.zoomScrollRegion(r, d.amt, 0)
      }
    } else if (d.op === 'zoomscroll') {
      const zAmt = d.out ? 1 / d.plength : d.plength
      const sAmt = r.width * (d.pstart - 0.5 + d.plength / 2) * (d.out ? 1 : -1)
      if (this.app.scrollLock) {
        this.zoomScrollAllRegions(zAmt, sAmt, 'px')
      } else {
        this.zoomScrollRegion(d.region, zAmt, sAmt, 'px')
      }
    } else if (d.op === 'init-regions') {
      this.initializeRegions(d.strips)
    } else if (d.op === 'set') {
      this.setRegion(r, d.coords)
    } else if (d.op === "split") {
      this.splitRegion(r, d.pos)
    } else if (d.op === "reverse") {
      this.reverseRegion(r, d.value)
    } else if (d.op === "make-reference") {
      this.app.rGenome = r.genome
      this.removeAllBut(r)
    } else if (d.op === 'delete-strip') {
      this.deleteStrip(r.genome)
    } else if (d.op === 'remove') {
      this.removeRegion(r)
    } else if (d.op === 'remove-all-but') {
      this.removeRegion(r, true)
    } else if (d.op === 'new') {
      this.addRegion(r, d.only)
    } else if (d.op === 'jump-to') {
      this.jumpTo(d.coords)
    } else if (d.op === 'feature-align') {
      this.featureAlign(d).then(() => this.announce())
      return
    } else if (d.op === 'set-ref-genome') {
      this.setRefGenome(d.genome)
      this.computeMappedRegions().then(() => this.announce())
      return
    } else if (d.op === 'clear-ref-genome') {
      this.clearRefGenome()
    } else if (d.op === 'set-lock-mode') {
      this.setLockMode()
    } else if (d.op === 'clear-lock-mode') {
      this.clearLockMode()
    } else if (d.op === 'set-genomes') {
      this.setStrips(d.vGenomes.map(n => this.app.dataManager.lookupGenome(n))).then(() => {
        this.announce()
      })
      return
    }
    //
    if (r && (r.genome === this.app.rGenome)) {
      this.computeMappedRegions().then(() => this.announce())
    } else {
      this.announce()
    }
  }
  //--------------------------------------
  //
  announce () {
    this.app.$root.$emit('context-changed')
  }
  //
  getParameterString () {
    let parms
    const app = this.app
    const strips = app.strips.concat()
    strips.sort((a,b) => a.order - b.order)
    const rs = strips.map(s => {
      const rs = s.regions.map(r => `${r.chr.name}:${r.start}..${r.end}/${Math.floor(r.width) * (r.reversed ? -1 : 1)}`).join(',')
      return `${s.genome.name}::${rs}`
    }).join('|')
    parms = [
      `regions=${rs}`
    ]
    //
    if (app.rGenome) parms.push('ref=' + app.rGenome.name)
    else if (app.scrollLock) parms.push('lock=on')
    //
    if (app.includeParalogs) parms.push('paralogs=on')
    else parms.push('paralogs=off')
    //
    return parms.join('&')
  }
}

export default RegionManager
