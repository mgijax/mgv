/*
 * Layout.js
 *
 * Several algorithms that deal with arranging features for display.
 * Usage pattern is the same in all cases (except SpreadText - see below): you create
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

class SwimLaneAssigner {
  constructor () {
    this.lanes = []
  }
  assignNext (fstart, fend) {
    for (let i = 0; i < this.lanes.length; i++) {
      let hwm = this.lanes[i]
      if (fstart > hwm) {
        this.lanes[i] = fend
        return i + 1
      }
    }
    this.lanes.push(fend)
    return this.lanes.length
  }
}

class FeaturePacker {
  constructor (ygap, minXgap) {
    // y distance between blocks.
    this.ygap = ygap || 0
    // min allowed
    this.minXgap = (minXgap === undefined || minXgap === null) ? 1 : minXgap
    // overlapping features.
    this.buffer = []
  }
  assignNext (fstart, fend, fheight, fsymbol) {
    // buffer should contain only things that overlap
    // or are no more that minXgap away
    this.buffer = this.buffer.filter(ff => {
      // return fstart <= ff.fend && fend >= ff.fstart
      return fstart - ff.fend <= this.minXgap
    })
    // Look for a big enough gap in the y dimension between buffer items
    // to fit this new one. If none found, stack on top.
    // Buffer is maintained in sorted y order.
    // NB: remember, positive y is down in screen coords
    let minGap = fheight + 2 * this.ygap
    let y = 0 // start off at baseline
    let i
    for (i = 0; i < this.buffer.length; i++) {
      let ff = this.buffer[i]
      // distance between current y and top of next block in buffer
      let gapSize = ff.y - y
      if (gapSize >= minGap) {
        break
      }
      // set current y to bottom of this buffer block
      y = ff.y + ff.fheight
    }
    // Found y for new block's baseline. Want position at top of block.
    y += this.ygap
    // Insert into buffer. Maintain y sort.
    this.buffer.splice(i, 0, {fstart, fend, fheight, y, fsymbol})
    // here ya go
    return y
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

export { ContigAssigner, SwimLaneAssigner, FeaturePacker, SegmentLayout }
