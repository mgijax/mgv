// ---------------------------------------------------------------------
class InterMineConnection {
  // Args:
  //   url - web service base URL
  //   isMouseMine - boolean. If true, uses MouseMine model for strains
  constructor (url, isMouseMine) {
    this.url = url
    this.qUrl = this.url + '/query/results?'
    this.seqSliceUrl = this.url + '/sequence?'
    this.faUrl = this.url + '/query/results/fasta?'
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
  getFastaUrl (f, type, isMouseMine) {
    feats = Array.isArray(f) ? f : [f]
    type = type ? type.toLowerCase() : 'genomic'
    const type2class = {
      'genomic': 'Gene',
      'transcript': 'Transcript',
      'exon': 'Exon',
      'cds': 'CDS'
    }
    const qclass = type2class[type]
    const genepath = qclass + (qclass === 'Gene' ? '' : '.gene')
    const canonicalpath = genepath + (isMouseMine ? '.canonical' : '')
    // const genomeidentpath = qclass + (isMouseMine ? '.strain.name' : '.organism.taxonId')
    // const genomevals = (genomes || []).map((g) => `<value>${g[isMouseMine ? 'name' : 'taxonid']}</value>`).join('')
    // const genomeconstraint = genomes ? `<constraint path="${genomeidentpath}" op="ONE OF">${genomevals}</constraint>` : ''
    const featurevals = feats.map(f => `<value>${f.ID}</value>`).join('')
    const featureconstraint = `<constraint path="${qclass}.primaryIdentifier" op="ONE OF" value="${featureVals}"/>`
    const view = `${canonicalpath}.primaryIdentifier`
    const q = `<query model="genomic" view="${qclass}.primaryIdentifier">${featureconstraint}</query>`
    const url = this.faUrl + `query=${encodeURIComponent(q)}&view=${encodeURIComponent(view)}`
    return q
  }
}

class MouseMineConnection extends InterMineConnection {
  constructor (url) {
    super(url, true)
  }
}

export { InterMineConnection, MouseMineConnection }
