let fail = function (message) {
  throw message
}

// Parses a string containing coordinates specified like 4:12345678..12387654
// Returns an object of the form { chr, start, end }.
// Returns null if the string fails to parse.
function parse (s) {
  let m = s.match(/^([^:]+):(\d+)\.\.(\d+)/)
  if (!m) return null
  let c = {
    chr: m[1],
    start: parseInt(m[2]),
    end: parseInt(m[3])
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

function overlaps (f, g) {
  return (f.chr.name || f.chr) === (g.chr.name || g.chr) && f.start <= g.end && f.end >= g.start
}

function length (f) {
  return f.end - f.start + 1
}

export default {
  fail, validate, parse, setWidth, pan, zoom, overlaps, length
}
