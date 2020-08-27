const TAB = '\t'
const NL = '\n'
const HASH = '#'
const SEMI = ';'
const EQ = '='
// const COMMA = ","

const chrom  = 0
const pos    = 1
const id     = 2
const ref    = 3
const alt    = 4
const qual   = 5
const filter = 6
const info   = 7

//
function record2object (r) {
    return {
      chrom: r[chrom],
      pos: r[pos],
      id: r[id],
      ref: r[ref],
      alt: r[alt],
      qual: r[qual],
      filter: r[filter],
      info: r[info]
    }
}

// Parses the value in an attributes column (INFO, FILTER, ...) into an object
function parseAttributes (s) {
    return s.split(SEMI).reduce((a,v) => {
        // 'somevar="somevalue,somevalue,..."
        const i = v.indexOf(EQ)
        if (i === -1) {
          a[v] = true
        } else {
          const n = v.substr(0,i)
          const val = v.substr(i+1).slice(1,-1)
          a[n] = val
        }
        return a
    }, {})
}

function parseLine (s, returnObject) {
    if (s === "" || s.startsWith(HASH)) return null
    const fields = s.split(TAB)
    fields[pos] = parseInt(fields[pos])
    fields[info] = parseAttributes(fields[info])
    return returnObject ? record2object(fields) : fields
}

function parseFile (s, returnObjects) {
    return s.split(NL).map(l => parseLine(l, returnObjects)).filter(l=>l)
}

export default {
  parseFile
}
