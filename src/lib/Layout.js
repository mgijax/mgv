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

/*
 * Given a line of overlapping pieces of text (eg the feature symbols in a swim lane) spreads them
 * out in the x dimension to remove overlaps while minimizing total displacement.
 */
class TextSpreader {
  // spreads the words in the given contig
  // Arg:
  //   words - List of 'word' objects, each having two fields: x, width
  _spreadContig (words) {
    let end
    let total
    words.forEach((w, i) => {
      if (i === 0) {
        end = w.x + w.width + 1
        total = 0
      } else {
        total += end - w.x
        w.x = end
        end += w.width + 1
      }
    })
    let dx = total / words.length
    words.forEach(w => { w.x -= dx })
    return dx
  }
  // perform a single pass over the list.
  // identify contigs and spread each one.
  // return true iff a contig was found.
  _spread1 (words) {
    let buffer = []
    let hwm = -Infinity
    let contigFound = false
    for (let i = 0; i < words.length; i += 1) {
      let w = words[i]
      if (w.x > hwm) {
        if (buffer.length > 1) {
          let dx = this._spreadContig(buffer)
          contigFound = dx > 0
        }
        buffer = []
      }
      buffer.push(w)
      hwm = Math.max(hwm, w.x + w.width)
    }
    return contigFound
  }
  //
  spread (words) {
    let i = 0
    while (i <= 100 && this._spread1(words)) {
      i += 1
    }
  }
}

export { ContigAssigner, SwimLaneAssigner, FeaturePacker, TextSpreader }
