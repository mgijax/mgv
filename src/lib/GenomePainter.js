//
import gc from '@/lib/GenomeCoordinates'

// ---------------------------------------------------------------------
//
// GenomePainter
//
// Allows user to paint regions of the genome and keep track of those regions.
// Each call to paint (abstractly) colors one contiguous segment of a chromosome.
// Calls to paint can arbitrarily overlap already painted segments.
// Each call therefore returns a (possibly empty) list of blank segments that were filled in.
//
// GenomePainter also supports erasing. Analogous to painting, each call to erase 
// returns possibly empty list of what painted sections got cleared.
// 
class GenomePainter {
    constructor () {
      // A multilevel map, from genome to chromosomes to lists of region coordinates
      this.paintedRegions = {}
    }
    // Returns list of currently painted regions of chromosome c of genome g.
    getPaintedRegions (g, c) {
        if (! this.paintedRegions[g.name]) this.paintedRegions[g.name] = {}
        const gregions = this.paintedRegions[g.name]
        if (! gregions[c.name]) gregions[c.name] = []
        const cregions = gregions[c.name]
        return cregions
    }

    // Paint chromosome c of genome g from s to e.
    // Returns list of gaps that were painted over.
    paint (g, c, s, e) {
        const region = {start:s, end:e}
        const cregions = this.getPaintedRegions(g, c)
        const gaps = gc.subtract(region, cregions)
        // Compute the merge of the new region with overlapping painted regions.
        let mregion = region
        let mstart = -1
        let ipos = -1
        let runLen = 0
        cregions.forEach((r, i) => {
            if (ipos === -1 && r.start >= mregion.start) ipos = i
            if (gc.overlaps(r, mregion)) {
                if (mstart === -1) mstart = i
                mregion = gc.merge(mregion, r)
                runLen += 1
            }
        })
        // Replace overlapped regions with single merged region
        if (mstart === -1) {
            if (ipos === -1) {
                cregions.push(mregion)
            } else {
                cregions.splice(ipos, 0, mregion)
            }
        } else {
            cregions.splice(mstart, runLen, mregion)
        }
        // return the painted in segments
        return gaps
    }
    // Removes paint from chromosome c of genome g from s to e.
    // Returns list of painted segments that were erased.
    erase (g, c, s, e) {
        this._invert(g, c)
        const res = this.paint(g, c, s, e)
        this._invert(g, c)
        return res
    }

    // Inverts the painting of chromosome c of genome g. 
    // (Converts painted regions to gaps and gaps to painted regions.)
    _invert (g, c) {
        const regions = this.getPaintedRegions(g, c)
        if (regions.length === 0) {
            this.paintedRegions[g.name][c.name] = [{ start:1, end: c.length }]
            return this.paintedRegions[g.name][c.name]
        }
        const inverted = []
        let prev = null
        regions.forEach(r => {
            if (prev === null) {
                if (r.start > 1) inverted.push({ start: 1, end: r.start - 1})
            } else if (prev.end + 1 < r.start) {
                inverted.push({start: prev.end + 1, end: r.start - 1})
            }
            prev = r
        })
        if (prev) {
            if (prev.end < c.length) inverted.push({start: prev.end + 1, end: c.length})
        }
        this.paintedRegions[g.name][c.name] = inverted
        return inverted
    }
}
export {
    GenomePainter
}
