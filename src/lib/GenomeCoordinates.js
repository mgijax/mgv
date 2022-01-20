let fail = function (message) {
  throw message
}

// Parses a string containing coordinates specified like 4:12345678..12387654
// (alternatively, 4:12345678-12387654)
// Returns an object of the form { chr, start, end }.
// Returns null if the string fails to parse.
function parse (s) {
  let m = s.match(/^([^:]+):(\d+)(\.\.|-)(\d+)/)
  if (!m) return null
  let c = {
    chr: m[1],
    start: parseInt(m[2]),
    end: parseInt(m[4])
  }
  if (c.chr.length > 0 && c.start > 0 && c.start <= c.end) return c
  return null
}

// Validates the given coordinates (sanity checks etc.)
// Throws an exception (with the reason) if validation fails.
// Otherwise returns the coordinates.
// Args:
//   c (object) Coordinates object. Must have fields chr, start and end.
//       chr must be a string. start and end must be integers greater than 0
//       and start <= end. Addition checks are made if the second argument is given.
//   g (Genome) If given, then c.chr must be a valid chromosome in g and the coordinates
//       must be within the range of the chromosome's length
//   adjust (boolean) If g is given and adjust is true, and if the coordinates extend beyond
//       either end of the chromosome, adjust the coordinates so they are valid rather than
//       raise an error.
// Returns:
//   The original coordinates, possibly adjusted to be valid.
// Throws:
//   Raises an exception if the coordinates are invalid
function validate (c, g, adjust) {
  if (!c) fail('Coordinates are null.')
  if (typeof c !== 'object') fail('Coordinate is not an object.')
  if (!c.chr || (typeof c.chr !== 'string' && typeof c.chr.name !== 'string')) fail('No chromosome.')
  if (typeof c.start !== 'number') fail('No start coordinate.')
  if (typeof c.end !== 'number') fail('No end coordinate.')
  if (c.start > c.end) fail('Start is greater than end.')
  let chrom
  if (g) {
    if (!g.chromosomes) fail('Genome has no chromosomes.')
    chrom = g.chromosomes.filter(gc => (c.chr.name || c.chr) === gc.name)[0]
    if (!chrom) fail('Chromosome not found in genome.')
    c.chr = chrom
    if (adjust) {
      let len = c.end - c.start + 1
      if (len >= chrom.length) {
        c.start = 1
        c.end = chrom.length
      } else if (c.start < 1) {
        c.start = 1
        c.end = len
      } else if (c.end > chrom.length) {
        c.end = chrom.length
        c.start = c.end - len + 1
      }
    }
    if (chrom.end > chrom.length) fail('End coordinate larger than chromosome length.')
  }
  if (c.start < 1) fail('Bad start position.')
  c.genome = g
  return c
}

function setWidth (c, w) {
  w = Math.round(w)
  if (w < 1) {
    return null
  }
  let mid = (c.start + c.end) / 2
  let newStart = Math.max(1, Math.round(mid - w / 2))
  return {
    chr: c.chr,
    start: newStart,
    end: newStart + w - 1
  }
}

function zoom (c, amount) {
  if (amount <= 0) {
    return null
  }
  let w = Math.max(1, (c.end - c.start + 1) / amount)
  return setWidth(c, w)
}

function pan (c, amount) {
  let w = c.end - c.start + 1
  let dx = Math.round(w * amount)
  let newstart = Math.max(1, c.start + dx)
  return {
    chr: c.chr,
    start: newstart,
    end: newstart + w - 1
  }
}

// Returns true iff the two regions overlap. If chromosomes are specified in the region, they must match.
function overlaps (f, g) {
  const chrSame = !f.chr || !g.chr || (f.chr.name || f.chr) === (g.chr.name || g.chr)
  const coordsOverlap =  f.start <= g.end && f.end >= g.start
  return chrSame && coordsOverlap
}

// Merges the two regions
function merge (r1, r2) {
  return { start: Math.min(r1.start, r2.start), end: Math.max(r1.end, r2.end) }
}

// Returns the difference between a region r1, and a list of regions r2s.
// The regions in r2s must be sorted by start position and be non-overlapping.
// Returns a list of regions that represents the removal of regions in r2s from r1.
function subtract (r1, r2s) {
    if (!Array.isArray(r2s)) r2s = [ r2s ]
    const breakpoints = r2s.map(r2 => [r2.start, "start2"]).concat(r2s.map(r2 => [r2.end, "end2"]))
    breakpoints.push([r1.start, "start1"])
    breakpoints.push([r1.end, "end1"])
    breakpoints.sort((a,b) => a[0] - b[0])
    let in1 = false
    let in2 = false
    let inGap = false
    let gapStart = NaN
    const gaps = []
    breakpoints.forEach(bp => {
        const coord = bp[0]
        const btype = bp[1]
        if (btype === "start1") {
            in1 = true
            if (!in2) {
                inGap = true
                gapStart = coord
            }
        } else if (btype === "end1") {
            in1 = false
            if (inGap) {
                gaps.push({start: gapStart, end: coord})
                inGap = false
            }
        } else if (btype === "start2") {
            in2 = true
            if (inGap) {
                gaps.push({start: gapStart, end: coord-1})
                inGap = false
            }
            inGap = false
        } else if (btype === "end2") {
            in2 = false
            gapStart = coord + 1
            inGap = in1
        }
    })
    return gaps.filter(g => g.start <= g.end)
}

function overlapAmount (f, g) {
  if ((f.chr.name || f.chr) === (g.chr.name || g.chr)) {
    const s = Math.max(f.start, g.start)
    const e = Math.min(f.end, g.end)
    return e - s + 1
  } else {
    return NaN
  }
}

function distanceBetween (f, g) {
  return -overlapAmount(f, g)
}

function length (f) {
  return f.end - f.start + 1
}

export default {
  fail, validate, parse, setWidth, pan, zoom, overlaps, length, overlapAmount, distanceBetween, merge, subtract
}
