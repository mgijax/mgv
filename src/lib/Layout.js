/*
 * Layout.js
 *
 * Several algorithms that deal with arranging features for display.
 * Usage pattern is the same in all cases: you create
 * an assigner instance and then feed it coordinates, one feature at a time.
 * Each call returns the layout value (eg a swim lane)
 * Features MUST be sorted by start position (this is not checked).
 */
class ContigAssigner {
  constructor () {
    this.contig = 0
    this.hwm = null
  }
  assignNext (fstart, fend) {
    if (this.hwm === null || fstart > this.hwm) this.contig += 1
    this.hwm = Math.max(this.hwm, fend)
    return this.contig
  }
}

/*
 * FeaturePacker
 *
 * The main layout used by the ZoomView.
 * The caller iterates over a list of features (or whatever) sorted by increasing start position.
 * Each call to assignNext passes the next rectangle's dimensions (xmin, xmax, height). 
 * (Symbol is also passed but is unused.) The return value is the assigned y coordinate of the top
 * of the rectangle in the layout.
 * It is the caller's responsibility to adjust start/end to account for labels, glyphs, etc.
 */ 
class FeaturePacker {
    constructor (yGap, minXgap) {
        this.yGap = yGap || 0
        this.minXgap = minXgap || 0
        // features sorted by start position
        this.features = []
        this.id2feat = new Map()
        this.maxY = 0
    }
    add (fId, fStart, fEnd, fHeight, noPackY) {
        if (fId && this.id2feat.has(fId)) {
            return this.id2feat.get(fId).y
        }
        const f = {
            ID: fId,
            start: fStart,
            end: fEnd,
            height: fHeight,
            y: 0
        }
        fId && this.id2feat.set(fId, f)
        // First, find everything in the current layout that overlaps the new feature in the x dimension.
        // Along the way, find the list insertion point for the new feature.
        const xOver = []
        // Also keep track of current contig
        let cContig = []
        let cContigHwm = -1
        //
        const minYgap = Math.max(1, fHeight) + 2 * this.yGap
        let i = 0
        let j = null
        for (i in this.features) {
            const f2 = this.features[i]
            // Keep track of the feature contig
            if (f2.start > cContigHwm) {
                cContig = [f2]
                cContigHwm = f2.end
            } else {
                cContig.push(f2)
                cContigHwm = Math.max(cContigHwm, f2.end)
            }
            if (f2.start > f.start && j === null) {
                // record f's insert position
                j = i
            }
            if (f2.start > f.end + this.minXgap) {
                // nothing else can overlap f after this point
                break
            } else if (f2.end >= f.start - this.minXgap) {
               xOver.push(f2)
            }
        }
        // Add new feature at insertion point
        if (j === null) {
            this.features.push(f)
        } else {
            this.features.splice(j, 0, f)
        }

        if (noPackY) {
            if (f.start > cContigHwm) cContig = []
            f.y = cContig.length ? Math.max.apply(null, cContig.map(ff => ff.y + ff.height + this.yGap)) : 0
        } else {
            // Sort the overlapping features by their assigned y coordinates
            xOver.sort((a,b) => a.y - b.y)

            // Now find a y gap that's big enough to insert the new feature, or if none found,
            // stack it on the last one.
            let y = 0
            for (i in xOver) {
                let f2 = xOver[i]
                if (f2.y - y >= minYgap) {
                    break
                }
                y = f2.y + f2.height
            }
            f.y = y + this.yGap
        }
        //
        this.maxY = Math.max(this.maxY, f.y)
        return f.y
    }
}

//
// Spreads out one-dimensional segments to remove overlaps while
// minimizing overall displacement.
//
class SegmentLayout {
  // Finds 
  findContigs (segments) {
    return segments.reduce((contigs, s) => {
      const slen = s.end - s.start + 1
      const ccontig = contigs[contigs.length - 1]
      if (!ccontig || ccontig.end < s.start) {
        // s starts a new contig
        contigs.push({
          start: s.start, // min start
          end: s.end, // max end
          members: [s], // the contig members
          mlength: slen // sum of length of all members
        })
      } else {
        // s is part of current contig
        ccontig.end = Math.max(ccontig.end, s.end)
        ccontig.members.push(s)
        ccontig.mlength += slen
      }
      return contigs
    }, [])
  }
  layoutContigMembers (c, start) {
    c.members.forEach(m => {
      if (m.members) {
        // m is itself a contig. recurse
        this.layoutContigMembers(m, start)
        start += m.mlength
      } else {
        // m is a base segment
        const mlen = m.end - m.start + 1
        m.start = start
        m.end = start + mlen - 1
        start += mlen
      }
    })
    c.start = c.members[0].start
    c.end = c.start + c.mlength - 1
  }
  spreadContig (c) {
    const midpt = (c.start + c.end) / 2
    let start = midpt - c.mlength / 2
    this.layoutContigMembers(c, start)
  }
  // List of one-dimensional segments. Each segment has a start and end position, both integers,
  // where end is >= start. The length of a segment is end - start + 1.
  layout (segments) {
    let again
    do {
      again = false
      segments.sort((s1,s2) => s1.start - s2.start)
      const contigs = this.findContigs(segments)
      contigs.forEach(c => {
        if (c.members.length > 1) {
          this.spreadContig(c)
          again = true
        }
      })
      segments = contigs
    } while (again);
  }
}

export { ContigAssigner, FeaturePacker, SegmentLayout }
