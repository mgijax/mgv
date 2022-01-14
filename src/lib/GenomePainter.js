//
import gc from '@/lib/GenomeCoordinates'

// ---------------------------------------------------------------------
// Keeps track of painted regions and closes gaps when overlapping regions are painted.
// User calls paint(g, c, s, e) to "paint" the region from s to e of chromosome c for genome g.
// Return value is the list of "closed gaps" filled in by the new painted region.
//
class GenomePainter {
    constructor () {
      // A multilevel map, from genome to chromosomes to lists of region coordinates
      this.paintedRegions = {}
    }
    // Paint chromosome c from s to e. Returns list of gaps that were painted over.
    paint (g,c,s,e) {
        if (! this.paintedRegions[g.name]) this.paintedRegions[g.name] = {}
        const gregions = this.paintedRegions[g.name]
        //
        if (! gregions[c.name]) gregions[c.name] = []
        const cregions = gregions[c.name]
        //
        const region = {start:s, end:e}
        const gaps = gc.subtract(region, cregions)

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

        if (mstart === -1) {
            if (ipos === -1) {
                cregions.push(mregion)
            } else {
                cregions.splice(ipos, 0, mregion)
            }
        } else {
            cregions.splice(mstart, runLen, mregion)
        }

        return gaps
    }
}
export {
    GenomePainter
}
