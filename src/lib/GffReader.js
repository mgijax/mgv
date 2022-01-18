// ---------------------------------------------------------------------
// Reader for a gff track for a genome
//
class GffReader {
  constructor (fetcher, track, genome, fetchUrl) {
    this.fetcher = fetcher
    this.track = track
    this.genome = genome
    this.fetchUrl = fetchUrl
  }
  read (regions) {
    const desc = [{
        "genome" : this.genome.path,
        "track" : this.track,
        "regions" : regions
    }]
    const qstring = encodeURI(JSON.stringify(desc))
    const url = `${this.fetchUrl}?datatype=gff&descriptors=${qstring}`
    return this.fetcher.fetch(url, 'gff')
  }
  readAll () {
    const regions = this.genome.chromosomes.map(c => c.name).join(' ')
    return this.read(regions)
  }
  readRange (c, s, e) {
    const region = `${c['name']}:${s}-${e}`
    return this.read(region)
  }
}
export {
    GffReader
}
