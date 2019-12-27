/*
 * vcflite.js
 *
 * Utilities for working with VCF.
 *
 * Example:
 * CHROM  POS     ID      REF     ALT     QUAL    FILTER  INFO
 * 1       4493192 NC_000067.6:g.4493192A>C        A       C       .       .       hgvs_nomenclature="NC_000067.6:g.4493192A>C";ge    neLevelConsequence="missense_variant";impact="MODERATE";symbol="Sox17<sup>SHIVA</sup>";soTerm="point_mutation";alleles="MGI:575    1535";allele_of_genes="MGI:107543";symbol_text="Sox17<SHIVA>"
 */
const HEADER = ''

const TAB = '\t'
const NL = '\n'
const HASH = '#'
const SEMI = ';'
const EQ = '='


// Parse VCF header. Returns a metadata object.
// Example header:
//      ##contig=<ID=,length=,assembly=GRCm38,md5=,species="Mus musculus",taxonomy=x>
//      ##fileDate=20191113
//      ##fileformat=VCFv4.2
//      ##INFO=<ID=hgvs_nomenclature,Number=1,Type=String,Description="the HGVS name of the allele">
//      ##INFO=<ID=geneLevelConsequence,Number=.,Type=String,Description="VEP consequence of the variant">
//      ##INFO=<ID=impact,Number=1,Type=String,Description="Variant impact scale">
//      ##INFO=<ID=symbol,Number=1,Type=String,Description="The human readable name of the allele">
//      ##INFO=<ID=soTerm,Number=1,Type=String,Description="The Sequence Ontology term for the variant">
//      ##INFO=<ID=alleles,Number=.,Type=String,Description="The alleles of the variant">
//      ##INFO=<ID=allele_of_genes,Number=.,Type=String,Number=1,Description="The genes that the Allele is located on">
//      ##INFO=<ID=symbol_text,Number=1,Type=String,Description="Another human readable representation of the allele">
//      ##phasing=partial
//      ##source=AGR VCF File generator
//      #CHROM  POS     ID      REF     ALT     QUAL    FILTER  INFO
// Returns the above data in the form of an object:
//      {
//        contig: { ID:null, length:null, assembly: 'GRCm38', md5=null, species='Mus musculus', taxonomy='x' },
//        fileDate: '20191113',
//        fileformat: 'VCFv4.2',
//        INFO: [
//        ],
//        phasing: 'partial',
//        source: 'AGR VCF File generator',
//        __columns__ : ['CHROM','POS','ID','REF','ALT','QUAL','FILTER','INFO']
//      }
//
function parseHeader (h) {
  let hlines
  if (typeof(h) === "string") {
    hlines = h.split('\n')
  } else if (Array.isArray(h)) {
    hlines = h
  }
  const meta = hlines.reduce((m,line) => {
    let i
    if (line.startsWith('##')) {
      parseNVpair(line, m)
    } else if (line.startsWith('#')) {
      const cols = line.substr(1).split('\t')
      m.__columns__ = cols
    }
    return m
  }, {})
  return meta
}

// Parses a name/value pair header line
// Args:
//   line - the full line, including the "##'
//   obj  - where to put the name/value pair. If obj already
//          has that name defined, the values are accumulated in a list
//
function parseNVpair (line, obj) {
  const i = line.indexOf('=')
  const n = line.substring(2, i)
  let v = line.substr(i+1)
  if (obj[n] !== undefined) {
    if (typeof(obj[n]) === "string" ) obj[n] = [obj[n]]
    obj[n].push(v)
  } else {
    obj[n] = v
  }
}

// Parses an embedded object value. Example:
// Args:
//   val - the embedded object string, e.g.:
//      <ID=hgvs_nomenclature,Number=1,Type=String,Description="the HGVS name of the allele">
// Returns:
//  The parsed object, e.g.:
//    { ID:'hgvs_nomenclature', Number: 1, type: 'String', Description='the HGVS name of the allele' }
//
//
function parseObject (val) {
    
}

// Parses a data line.
// Args:
//   line - the data line
//   meta - the metadata object from parsing the file header
// Returns:
//   Object with one field per column.
//   The INFO column is parsed.
//   The POS column is converted to int.
function parseLine (line, meta) {
  const o = {}
  line.split('\t').forEach( (fld, i) => {
    const cname = meta.__columns__[i]
    if (cname === "POS") {
      fld = parseInt(fld)
    } else if (cname === "INFO") {
      fld = parseInfo(fld)
    }
    o[cname] = fld
  })
  return o
}

// Parses an INFO field, returns the settings as an object
//
// Example:
// hgvs_nomenclature="NC_000067.6:g.4493192A>C";geneLevelConsequence="missense_variant";impact="MODERATE";symbol="Sox17<sup>SHIVA</sup>";soTerm="point_mutation";alleles="MGI:5751535";allele_of_genes="MGI:107543";symbol_text="Sox17<SHIVA>"
//
function parseInfo (info) {
  const next = function (c, i) {
    const j = info.indexOf(c, i)
    if (j === -1) throw `Could not find ${c} in ${info} starting at ${i}.`
    return j
  }
  let i0 = 0
  const o = {}
  while (true) {
    const i = next('=', i0)
    const n = info.substring(i0, i).trim()
    const vi = next('"', i+1)
    const vj = next('"', vi+1)
    const v = info.substring(vi+1, vj)
    o[n] = v
    i0 = info.indexOf(';', vj+1) + 1
    if (i0 === 0) break;
  }
  return o
}

//
function parseFile (s) {
  return parseHeader(s)
}


//
export default {
 parseFile
}
