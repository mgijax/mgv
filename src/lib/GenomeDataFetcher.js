//
import u from '@/lib/utils'
//
// ---------------------------------------------------------------------
class InterMineConnection {
  // Args:
  //   utl - web service base URL
  constructor (url) {
    this.url = url
    this.qUrl = this.url + '/query/results?'
    this.seqSliceUrl = this.url + '/sequence?'
    this.faUrl = this.url + '/query/results/fasta?'
    this.fetchCount = 0
  }
  // Args:
  //   q - query in XML fomat
  //   mapper - (optional) function that maps each result into a desired form
  query (q, mapper) {
    mapper = mapper || (x => x)
    let format = 'json'
    let query = encodeURIComponent(q)
    let url = this.qUrl + `format=${format}&query=${query}`
    return u.fetch(url, 'json').then(data => data.results.map(mapper))
  }
  getSequenceSlice (q, start, end) {
    const url = this.seqSliceUrl + `start=${start - 1}&end=${end}&query=${encodeURIComponent(q)}`
    return u.fetch(url, 'json').then(data => data.features[0])
  }
}
// ---------------------------------------------------------------------
//
// Abstract superclass for anything that reads track data.
// Each reader is associated with a single genome.
// The fundamental call is to fetch data within a chromosomal range
class TrackReader {
  // Args:
  //   name - track name
  //   cfg - reader config
  //   genome - genome descriptor
  constructor (name, cfg, genome) {
    this.name = name
    this.cfg = cfg
    this.genome = genome
    this.url = cfg.url || genome.url
  }
  // Returns a promise for all the features in the track.
  readAll () {
    /* override me */
  }
  // Returns a promise for all features in the track on the given chromosome.
  readChromosome (c) {
    /* override me */
  }
  // Returns a promise for data overlapping the specified range.
  // Args:
  //   c - chromosome descriptor
  //   s - start coordinate
  //   e - end coordinate
  readRange (c, s, e) {
    /* override me */
  }
}
// ---------------------------------------------------------------------
// Abstract superclass for readers that return genome features.
class FeatureTrackReader extends TrackReader {
}
// ---------------------------------------------------------------------
// Implementation of a feature reader that reads chunked GFF3 files.
class ChunkedGff3FileReader extends FeatureTrackReader {
  readAll () {
    if (this.cfg.chunkSize === 0) {
      return u.fetch(`${this.url}/${this.name}/0`, 'gff3')
    } else {
      const ps = this.genome.chromosomes.map(c => this.readChromosome(c))
      return Promise.all(ps).then(u.concatAll)
    }
  }
  readChromosome (c) {
    return this.readRange(c, 1, c.length)
  }
  readRange (c, s, e) {
    let url
    let p
    if (this.cfg.chunkSize === 0) {
      url = `${this.url}/${this.name}/0`
      p = u.fetch(url, 'gff3').then(data => data.filter(f => f[0] === c.name))
    } else if (this.cfg.chunkSize === 1) {
      url = `${this.url}/${this.name}/${c.name}/0`
      p = u.fetch(url, 'gff3')
    } else {
      const minBlk = Math.floor(s / this.cfg.chunkSize)
      const maxBlk = Math.floor(e / this.cfg.chunkSize)
      const ps = []
      for (let i = minBlk; i <= maxBlk; i++) {
        url = `${this.url}/${this.name}/${c.name}/${i}`
        ps.push(u.fetch(url, 'gff3'))
      }
      p = Promise.all(ps).then(u.concatAll)
    }
    return p.then(data => data.filter(f => f[3] <= e && f[4] >= s))
  }
}
// ---------------------------------------------------------------------
// Abstract superclass of gff3 readers that read from an Intermine instance.
class IntermineFeatureReader extends FeatureTrackReader {
  constructor(name, cgf, genome) {
    super(name, cfg, genome)
    this.mine = new InterMineConnection(this.url)
  }
}
// ---------------------------------------------------------------------
// Abstract superclass for readers that return sequences (genomic or otherwise).
class SequenceTrackReader extends TrackReader {
}
// ---------------------------------------------------------------------
// Implementation for sequence readers that read from an Intermine instance.
class InterMineSequenceReader extends SequenceTrackReader {
  constructor(name, cfg, genome) {
    super(name, cfg, genome)
    this.mine = new InterMineConnection(this.url)
  }
  // Returns an XML query that returns the residues field of the specified chromosome
  // for the genome of this reader
  getQuery (chr) {
    return `<query model="genomic"
        view="Chromosome.sequence.residues">
        <constraint path="Chromosome.primaryIdentifier" op="=" value="${chr.name}" />
        <constraint path="Chromosome.organism.taxonId" op="=" value="${this.genome.taxonid}" />
      </query>`
  }
  readRange (chr, start, end) {
    return this.mine.getSequenceSlice(this.getQuery(chr), start, end)
  }
}
// ---------------------------------------------------------------------
// Implementation of a sequence reader the gets genomic sequences from MouseMine.
class MouseMineSequenceReader extends InterMineSequenceReader {
  // 
  getQuery (chr) {
    return `<query model="genomic"
      view="Chromosome.sequence.residues">
      <constraint path="Chromosome.primaryIdentifier" op="=" value="${chr.name}" />
      <constraint path="Chromosome.strain.name" op="=" value="${this.genome.name}" />
      </query>`
  }
}
// -------------------------------------------------------------------------------
const RegisteredReaderClasses = {
  ChunkedGff3FileReader,
  MouseMineSequenceReader
}
// -------------------------------------------------------------------------------
class GenomeReader {
  constructor (info) {
    this.info = info
    this.readers = this.info.tracks.reduce((a,t) => {
      const rclass = RegisteredReaderClasses[t.reader.type]
      a[t.name] = new rclass(t.name, t.reader, info)
      return a
    }, {})
  }
}

// -------------------------------------------------------------------------------
// Fetches genome descriptors from specified URLs and returns a promise for those descriptors.
// Also allows for indirection, ie, the specified URL may point to file containing further URLs to follow.
// As well, URLs may be absolute (begin with 'http://') or relative to the URL of the indirecting file.
// Protocol details:
//   User specifies a URL that points to a directory containing a file named 'index.json'
//   File may contain:
//      Genome descriptor. (object)
//      A forwarding URL. (string)
//      An array of descriptors and/or URLs. (list of strings and/or objects)
// Forwarding loop are tolerated
//
class GenomeRegistrar {
  constructor () {
    this.url2promise = {}
    this.name2genome = {}
    this.name2reader = {}
    this.indexName = '/index.json'
  }
  register (url) {
    let p = this.url2promise[url]
    if (p) return p
    this.url2promise[url] = p = u.fetch(this._adjust(url), 'json')
      .then(data => this._register(url, data))
      .catch(err => console.log(err))
    return p
  }
  _adjust (url) {
    if (url.endsWith(this.indexName)) return url
    return url + this.indexName
  }
  _register (url, data) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(d => this._register(url, d))).then(u.concatAll)
    } else if (typeof(data) === 'string') {
      let uu = data
      if (!data.startsWith('http://')){
        uu = url.replace(this.indexName, '/' + data)
      }
      return this.register(uu)
    } else {
      return Promise.resolve(this.registerGenome(url, data))
    }
  }
  registerGenome (url, info) {
    info.url = info.url || url
    this.name2genome[info.name] = info
    this.name2reader[info.name] = new GenomeReader(info)
    return info
  }
}

// -------------------------------------------------------------------------------
export { GenomeRegistrar }
