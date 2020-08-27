/*
 * gff3lite.js
 *
 * Utilities for working with GFF3.
 */

const TAB = '\t'
const NL = '\n'
const HASH = '#'
const SEMI = ';'
const EQ = '='


// define constants for the column indices
const seqid = 0
const source = 1
const type = 2
const start = 3
const end = 4
const score = 5
const strand = 6
const phase = 7
const attributes = 8

// Turns a parsed GFF3 line (an array with 9 items, the last of which is an object) into
// an object where:
//    - columns 1-8 are assigned to named fields
//    - all the attributes in column 9 are attributes of the returned object
function record2object (r) {
  const o = {}
  o.seqid = r[seqid]
  o.source = r[source]
  o.type = r[type]
  o.start = r[start]
  o.end = r[end]
  o.score = r[score]
  o.strand = r[strand]
  o.phase = r[phase]
  Object.assign(o, r[attributes])
  return o
}
// Parses column 9 into an object with attributes.
// FIXME: does not deal with multivalues attributes. Each value is just a string.
function parseAttributes (s) {
  const attrs = {}
  s.split(SEMI).forEach(x => {
    let pts = x.split(EQ)
    attrs[pts[0]] = decodeURIComponent(pts[1])
  })
  return attrs
}
// Parses one line of a GFF3 file. Returns either a record (array)
// or an object, according to the second parameter.
function parseLine (s, returnObjects) {
  if (s.startsWith(HASH)) return s
  const r = s.split(TAB).map((v,i) => {
    if (v === '.')
      return null
    else if (i === start || i === end || i === phase)
      return parseInt(v)
    else if (i === attributes)
      return parseAttributes(v)
    else
      return v
  })
  return returnObjects ? record2object(r) : r
}
// Parses the contents of a GFF3 file
function parseFile (s, returnObjects) {
  return s.split(NL).filter(l => l).map(l => parseLine(l, returnObjects))
}
export default {
  parseFile,
  parseLine,
  parseAttributes,
  record2object
}
