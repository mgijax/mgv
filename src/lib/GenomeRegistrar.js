//
import u from '@/lib/utils'
import ChunkedGff3FileReader from '@/lib/ChunkedGff3FileReader'
import { InterMineSequenceReader, MouseMineSequenceReader } from '@/lib/InterMineServices'
// -------------------------------------------------------------------------------
const RegisteredReaderClasses = {
  ChunkedGff3FileReader,
  InterMineSequenceReader,
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
    this.indexName = 'index.json'
  }
  getReader (g, n) {
    return this.name2reader[g.name].readers[n]
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
    if (url.endsWith('/')) return url + this.indexName
    return url
  }
  _combineUrl(url, ext) {
    if (ext.startsWith('http://')) {
      return ext
    } else if (ext.startsWith('/')) {
      // relative URL starting with '/'
      return url.slice(0,url.indexOf('/',7)) + ext
    } else {
      // relative URL not starting with '/'
      return url.slice(0,url.lastIndexOf('/')+1) + ext
    }
  }
  _register (url, data) {
    if (Array.isArray(data)) {
      // array. process each element and return a promise for the concatenated results.
      return Promise.all(data.map(d => this._register(url, d))).then(u.concatAll)
    } else if (typeof(data) === 'string') {
      // string. ie, a URL.
      return this.register(this._combineUrl(url, data))
    } else {
      // object, ie, a genome descriptor. Register the genome and return
      // it, wrapped in a promise
      return Promise.resolve(this.registerGenome(url, data))
    }
  }
  registerGenome (url, info) {
    info.url = info.url || url
    info.name2chr = info.chromosomes.reduce((a,c) => { a[c.name] = c; return a }, {})
    this.name2genome[info.name] = info
    this.name2reader[info.name] = new GenomeReader(info)
    return info
  }
}

// -------------------------------------------------------------------------------
export { GenomeRegistrar }
