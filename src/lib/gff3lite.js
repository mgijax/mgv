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
//    - columns 1-8 are assigned to named fields (defined by GFF3 standard)
//    - column 9 data stored in a field named 'attributes'.
// If second (optionl) argument is true, col 9 attributes are 'flattened' into main return obj.
function record2object (r, flattenAttributes) {
  const o = {}
  o.seqid = r[seqid]
  o.source = r[source]
  o.type = r[type]
  o.start = r[start]
  o.end = r[end]
  o.score = r[score]
  o.strand = r[strand]
  o.phase = r[phase]
  if (flattenAttributes) {
      Object.assign(o, r[attributes])
  } else {
      o.attributes = r[attributes]
  }
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
// Args:
//   s - the file contents to parse
//   returnObjects - boolean. If false, each feature is returned as an array of 9 elements.
//              If true, each feature is returned as an object, using the gff3 standard field names
//   returnHeaderLines - boolean. If true, lines beginning with "#" are filtered out.
//   returnModels - boolean. If false, features are returned individually. If true, features are
//              structured into a hierarchy based on Parent attributes (does not handle multiple parants).
function parseFile (s, returnObjects, returnHeaderLines, returnModels) {
  const notNullFilter = (x => x)
  const notHeaderFilter = (x => x && x[0] !== "#")
  const filterFcn = returnHeaderLines ? notNullFilter : notHeaderFilter
  const parsed = s.split(NL).filter(filterFcn).map(l => parseLine(l, returnObjects))
  if (!returnModels) {
      return parsed
  }
  // build an index from Parent ids to the features that list those parents
  const pid2kids = parsed.reduce((ix, f) => {
          const pid = f[8]['Parent']
          if (pid) {
              if (!ix[pid]) ix[pid] = []
              ix[pid].push(f)
          }
          return ix
      }, {})
  
  // Attach child features to their parents. Return the top level features
  const models = parsed.reduce((ms, f) => {
          const kids = pid2kids[f[8]['ID']]
          if (kids) f.children = kids
          if (!f[8]['Parent']) ms.push(f)
          return ms
      }, [])

  return models

}
export default {
  parseFile,
  parseLine,
  parseAttributes,
  record2object
}
