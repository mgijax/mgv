// ---------------------------------------------------------------------
// Reader for a fasta track for a genome
//
class FastaReader {
  constructor (fetcher, track, genome, url) {
    this.fetcher = fetcher
    this.track = track
    this.genome = genome
    this.url = url
  }
  read (regions,filename) {
    const desc = [{
        "genome" : this.genome.path,
        "track" : this.track,
        "regions" : regions
    }]
    const qstring = encodeURI(JSON.stringify(desc))
    const fnameArg = filename ? "&filename="+filename : ""
    const url = `${this.url}/fetch.cgi?datatype=fasta&descriptors=${qstring}${fnameArg}`
    return this.fetcher.fetch(url, 'gff')
  }
  readAll () {
    throw "Not implemented. FastaReader cannot readAll()."
  }
  readRange (c, s, e, filename) {
    const region = `${c['name']}:${s}-${e}`
    return this.read(region, filename)
  }
}
export {
    FastaReader
}
