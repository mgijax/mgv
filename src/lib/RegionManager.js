
import config from '@/config'
import u from '@/lib/utils'

// The RegionManager maintains the set of genomic regions that specify what to display in the ZoomView.
class RegionManager {
  constructor (app) {
    this.app = app
    this.app.$root.$on('region-change', d => this.regionChange(d))
    this.app.$root.$on('resize', () => this.layout())
  }
  // Returns the index of the strip for genome g, or -1 if no such strip exists.
  findStrip (g) {
    return this.app.strips.map(s => s.genome).indexOf(g)
  }
  // Returns the index of the specified region along with the index of the strip it was found in.
  // 
  findRegion (r) {
    const i = this.findStrip(r.genome)
    const j = (i === -1 ? -1 : this.app.strips[i].regions.indexOf(r))
    return [i, j]
  }
  //
  currentGenomes () {
    return u.removeDups(this.app.strips.map(s => s.genome))
  }

  // Add a strip to the display for genome g.
  addStrip (g) {
    const defaultRegion = {
      genome: g,
      chr: g.chromosomes[0],
      start: 1,
      end: 10000000
    }
    const strip = {
      genome: g,
      regions: [ defaultRegion ]
    }
    this.app.strips.push(strip)
    this.layout()
    return strip
  }
  //
  removeStrip (strip) {
    const i = this.app.strips.indexOf(strip)
    if (i >= 0) {
      this.app.strips.splice(i, 1)
    }
  }
  //--------------------------------------
  // Moves the border between r1 and its righthand neighbor by the specified amt (in pixels)
  moveBorder (r1, amt) {
    const rr = this.findRegion(r1)
    const si = rr[0], ri = rr[1]
    if (ri === -1) return
    const r2 = this.app.strips[si].regions[ri + 1]
    if (!r2) return
    r1.width += amt
    r2.width -= amt
    r2.deltaX += amt
  }
  //--------------------------------------
  setRegion(r, coords) {
    const rr = this.findRegion(r)
    if (rr[1] === -1) return
    if (r.chr !== coords.chr) r.chr = coords.chr
    if (r.start !== coords.start) r.start = coords.start
    if (r.end !== coords.end) r.end = coords.end
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
    r.start += delta
    r.end += delta
  }
  //--------------------------------------
  splitRegion (r, frac) {
    const rr = this.findRegion(r)
    const si = rr[0], ri = rr[1]
    if (ri === -1) return
    const r2 = Object.assign({}, r)
    const w = r.width
    const l = r.end - r.start + 1
    const ll = frac * l

    r.width = frac * w
    r.end = r.start + ll - 1
    r2.width = (1 - frac) * w
    r2.start = r.start + ll
    this.app.strips[si].regions.splice(ri + 1, 0, r2)
    this.layout()
  }
  // Maps a given region (genome+chr+start+end) to the equivalent regions in the given list of genomes
  // Returns a promise for the list of strips
  computeMappedRegions (r, genomes) {
    const tr = this.app.translator
    const promises = genomes.map(g => {
      return tr.translate(r.genome, r.chr.name, r.start, r.end, g).then(rs => {
        return {
          genome: g,
          regions: this._combineRegions(rs)
        }
      })
    })
    return Promise.all(promises).then(strips => {
      return this.layout(strips)
    })
  }
  // Combine regions whose indexes form a sequence
  // Only applies to computed (mapped) regions.
  _combineRegions (regions) {
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
  computeLandmarkRegions (lcoords, genomes) {
    const p = Promise.all(genomes.map(g => this.app.dataManager.ensureFeatures(g)))
    return p.then(() => genomes.map(g => this.computeLandmarkRegion(lcoords, g))).then(strips => this.layout(strips))
  }
  //
  computeLandmarkRegion (lcoords, genome) {
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
  //
  layout (strips, width) {
    strips = strips || this.app.strips
    width = width || this.app.zoomWidth
    strips.forEach(strip => {
      this.layoutStrip(strip, width)
    })
    return strips
  }
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
  xlayoutStrip (strip, width) {
    let totalLength = 0
    let totalWidth = 0
    let wcount = 0
    let no_wcount = 0
    strip.regions.forEach(r => {
      const l = r.end - r.start + 1
      if(l !== r.length) r.length = l
      totalLength += l
      if (r.width) {
        totalWidth += r.width
        wcount += 1
      } else {
        no_wcount += 1
      }
    })
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
      let w = ppb * r.length
      // only update the region if necessary
      if(w !== r.width) r.width = w
      if(dx !== r.delta) r.deltaX = dx
      dx += r.width + gap
    })
  }
  // Handler for region-change events
  // Args:
  //  d (object) event data, which includes:
  //    vm    The ZoomRegion component
  //    op    Operation. One of: scroll, zoom, remove
  //
  //    Other fields depend on the op.
  //    delta (When op = scroll) Amount to scroll.
  //    coords (When op = zoom) New coordinates to use.
  //
  regionChange (d, quietly) {
    if (d.op === 'scroll') {
      this.scrollRegion(d.vm.region, d.delta)
    } else if (d.op === 'zoom') {
      this.zoomRegion(d.vm.region, d.amt)
    } else if (d.op === 'set') {
      this.setRegion(d.vm.region, d.coords)
    } else if (d.op === 'remove') {
      this.removeRegion(d.vm.region)
    } else if (d.op === "split") {
      this.splitRegion(d.vm.region, d.pos)
    }
    if (!quietly) this.announce()
  }
  //
  announce () {
    this.app.$root.$emit('context-changed')
  }
}

export default RegionManager
