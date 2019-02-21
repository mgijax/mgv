import config from '@/config'
import u from '@/lib/utils'
import { SequenceTrackReader } from '@/lib/TrackReader'

// ---------------------------------------------------------------------
class InterMineConnection {
  // Args:
  //   url - web service base URL
  //   isMouseMine - boolean. If true, uses MouseMine model for strains
  constructor (baseurl, isMouseMine) {
    this.baseurl = baseurl.replace(/\/service\/?$/, '')
    this.wsurl = this.baseurl + '/service'
    this.qUrl = this.wsurl + '/query/results?'
    this.seqSliceUrl = this.wsurl + '/sequence?'
    this.faUrl = this.wsurl + '/query/results/fasta?'
    this.isMouseMine = isMouseMine
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

  // Returns a promise for the genomic sequence from genome g whose coordinates are given.
  getChromosomeSlice (g, c, start, end) {
    const genomepath = this.isMouseMine ? 'strain.name' : 'organism.taxonId'
    const genomeval = this.isMouseMine ? g.name : g.taxonid
    const q = `<query model="genomic"
        view="Chromosome.sequence.residues">
        <constraint path="Chromosome.primaryIdentifier" op="=" value="${c.name}" />
        <constraint path="Chromosome.${genomepath}" op="=" value="${genomeval}" />
      </query>`
    const url = this.seqSliceUrl + `start=${start - 1}&end=${end}&query=${encodeURIComponent(q)}`
    return u.fetch(url, 'json').then(data => data.features[0])
  }

  // Returns a URL for downloading sequences of the specified type for the specified features in Fasta format.
  //
  // Args:
  //  f - the feature(s) whose sequences you want. May be a single feature or array of features.
  //  type - which sequences. One of: genomic, transcript, cds, exon
  //  isMouseMine - if true, adjusts query paths for mouse genomes as stored in MouseMine.
  //      - genome constraint is based on strain name rather than taxon id
  //
  getFastaUrl (feats, type) {
    feats = Array.isArray(feats) ? feats : [feats]
    type = type ? type.toLowerCase() : 'genomic'
    const type2class = {
      'genomic': 'Gene',
      'transcript': 'Transcript',
      'exon': 'Exon',
      'cds': 'CDS'
    }
    const qclass = type2class[type]
    const genepath = qclass + (qclass === 'Gene' ? '' : '.gene')
    const canonicalpath = genepath + (this.isMouseMine ? '.canonical' : '')
    // const genomeidentpath = qclass + (this.isMouseMine ? '.strain.name' : '.organism.taxonId')
    // const genomevals = (genomes || []).map((g) => `<value>${g[this.isMouseMine ? 'name' : 'taxonid']}</value>`).join('')
    // const genomeconstraint = genomes ? `<constraint path="${genomeidentpath}" op="ONE OF">${genomevals}</constraint>` : ''
    const featurevals = feats.map(f => `<value>${f.ID}</value>`).join('')
    const featureconstraint = `<constraint path="${genepath}.primaryIdentifier" op="ONE OF">${featurevals}</constraint>`
    const view = `${canonicalpath}.primaryIdentifier`
    const q = `<query model="genomic" view="${qclass}.primaryIdentifier">${featureconstraint}</query>`
    const url = this.faUrl + `query=${encodeURIComponent(q)}&view=${encodeURIComponent(view)}`
    return url
  }
}

// ---------------------------------------------------------------------
class MouseMineConnection extends InterMineConnection {
  constructor (url) {
    url = url || connections.MouseMine.url
    super(url, true)
  }
}

// ---------------------------------------------------------------------
// Implementation for sequence readers that read from an Intermine instance.
class InterMineSequenceReader extends SequenceTrackReader {
  constructor(fetcher, name, cfg, genome) {
    super(fetcher, name, cfg, genome)
    this.mine = new InterMineConnection(this.url)
  }
  readRange (chr, start, end) {
    return this.mine.getChromosomeSlice(this.genome, chr, start, end)
  }
}
// ---------------------------------------------------------------------
// Implementation of a sequence reader the gets genomic sequences from MouseMine.
class MouseMineSequenceReader extends InterMineSequenceReader {
  constructor(fetcher, name, cfg, genome) {
    super(fetcher, name, cfg, genome)
    this.mine = new MouseMineConnection(this.url)
  }
}

// initialize a connection to each configured mine (for convenience only - no reqirement to use them!)
function initConnections () {
  return config.InterMineConnection.mines.reduce(
    (x,m) => { x[m.name] = new (m.name === 'MouseMine' ? MouseMineConnection : InterMineConnection)(m.url); return x }
    , {})
}

const connections = initConnections()
console.log(connections)

export { InterMineConnection, MouseMineConnection, InterMineSequenceReader, MouseMineSequenceReader, connections }
