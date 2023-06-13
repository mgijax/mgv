//
import u from './utils.js'
import config from '../config.js'
import KeyStore from './KeyStore.js'
import CachingFetcher from './CachingFetcher.js'
import { GffReader } from './GffReader.js'
import { FastaReader } from './FastaReader.js'
//
// -------------------------------------------------------------------------------
// Container for track readers for a genome
class GenomeReader {
  constructor (registrar, info) {
    this.registrar = registrar
    this.info = info
    const n = config.CachingFetcher.dbName
    this.fetcher = new CachingFetcher(n, info.path)
    this.kstore = new KeyStore(n)
    const fetchUrl = this.registrar.fetchUrl
    this.readers = this.info.tracks.reduce((a,t) => {
      if (t.filetype === 'gff') {
        a[t.track] = new GffReader({fetch: u.fetch}, t.track, info, fetchUrl)
        if (t.track === "models") {
          this.info.linkouts = t.linkouts
          a[t.track+'.genes'] = new GffReader(this.fetcher, 'models.genes', info, fetchUrl)
        }  
      } else if (t.filetype === 'fasta') {
        a[t.track] = new FastaReader({fetch: u.fetch}, t.track, info, fetchUrl)
      }
      return a
    }, {})
    this.readyp = this.checkTimestamp()
  }
  // -------------------------------------------------------------------------------
  // Compares the timestamp of the cached info for this genome against the timestamp
  // of the info we just loaded. If they differ, drop all cached data for this genome,
  // then save the new info.
  // Returns a promise that resolves when all that is done.
  checkTimestamp () {
    return this.kstore.get(this.info.path + '::INFO').then(cinfo => {
      if (!cinfo || cinfo.timestamp != this.info.timestamp) {
        return this.fetcher.clearNamespace().then(() => {
          return this.kstore.set(this.info.path+'::INFO', this.info)
        })
      }
    })
  }
  // Returns a promise that resolves when the genome is ready to start reading
  ready () {
    return this.readyp
  }
}
// -------------------------------------------------------------------------------
//
class GenomeRegistrar {
  constructor (fetchUrl) {
    this.fetchUrl = fetchUrl
    this.url2promise = {}
    this.name2genome = {}
    this.name2reader = {}
    this.indexName = 'index.json'
  }
  // Returns a promise for a reader for the specified track for the specified genome.
  getReader (g, n) {
    const gr = this.name2reader[g.name]
    return gr.ready().then( () => gr.readers[n] )
  }
  // Register
  register () {
    let p = this.url2promise[this.fetchUrl]
    if (p) return p
    const url2 = this.fetchUrl + '?datatype=metadata'
    this.url2promise[this.fetchUrl] = p = u.fetch(url2, 'json')
      .then(data => data.map(g => this.registerGenome(g)).filter(x=>x))
    return p
  }
  //
  lookupGenome (n) {
    return this.name2genome[n]
  }
  //
  registerGenome (info) {
    if (info.type !== "genome") return null
    info.url = info.url || this.fetchUrl
    info.name2chr = info.chromosomes.reduce((a,c) => { a[c.name] = c; return a }, {})
    info.chromosomes.forEach((c,i) => { c.index = i })
    info.stats = {}
    const gr = new GenomeReader(this, info)
    this.name2genome[info.name] = info
    this.name2reader[info.name] = gr
    this.name2genome[info.path] = info
    this.name2reader[info.path] = gr
    if (info.shortname) {
        this.name2genome[info.shortname] = info
        this.name2reader[info.shortname] = gr
    }
    return info
  }
}

// -------------------------------------------------------------------------------
export { GenomeRegistrar, GenomeReader }
