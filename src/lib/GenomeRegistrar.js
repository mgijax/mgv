//
import u from '@/lib/utils'
import config from '@/config'
import KeyStore from '@/lib/KeyStore'
import CachingFetcher from '@/lib/CachingFetcher'
import { ChunkedGff3FileReader, ChunkedVcfFileReader } from '@/lib/ChunkedFileReader'
//
// -------------------------------------------------------------------------------
// Container for track readers for a genome
class GenomeReader {
  constructor (registrar, info) {
    this.registrar = registrar
    this.info = info
    const n = config.CachingFetcher.dbName
    this.fetcher = new CachingFetcher(n, info.name)
    this.kstore = new KeyStore(n)
    this.readers = this.info.tracks.reduce((a,t) => {
      if (t.type === 'ChunkedGff3') {
        a[t.name] = new ChunkedGff3FileReader(this.fetcher, t.name, t.chunkSize, info, info.url + "models/")
      }
      else if (t.type === "ChunkedVcf") {
        a[t.name] = new ChunkedVcfFileReader(this.fetcher, t.name, t.chunkSize, info, info.url )
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
    return this.kstore.get(this.info.name + '::INFO').then(cinfo => {
      if (!cinfo || cinfo.timestamp != this.info.timestamp) {
        return this.fetcher.clearNamespace().then(() => {
          return this.kstore.set(this.info.name+'::INFO', this.info)
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
    this.indexName = 'index.json'
  }
  // Returns a TrackReader for track n of genome g
  getReader (g, n) {
    const gr = this.name2reader[g.name]
    return gr.ready().then( () => gr.readers[n] )
  }
  // Register
  register (url) {
    let p = this.url2promise[url]
    if (p) return p
    const url2 = url + '/fetch.cgi?datatype=metadata'
    this.url2promise[url] = p = u.fetch(url2, 'json')
      .then(data => data.map(g => this.registerGenome(url,g)).filter(x=>x))
    return p
  }
  lookupGenome (n) {
    return this.name2genome[n]
  }
  registerGenome (url, info) {
    if (info.type !== "genome") return null
    info.url = info.url || url
    info.name2chr = info.chromosomes.reduce((a,c) => { a[c.name] = c; return a }, {})
    info.chromosomes.forEach((c,i) => { c.index = i })
    info.metadata = {
      name: info.name
    }
    const gr = new GenomeReader(this, info)
    this.name2genome[info.name] = info
    this.name2reader[info.name] = gr
    this.name2genome[info.pathname] = info
    this.name2reader[info.pathname] = gr
    if (info.shortname) {
        this.name2genome[info.shortname] = info
        this.name2reader[info.shortname] = gr
    }
    return info
  }
}

// -------------------------------------------------------------------------------
export { GenomeRegistrar, GenomeReader }
