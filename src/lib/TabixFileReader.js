// ---------------------------------------------------------------------
class TabixFileReader {
  constructor (fetcher, track, genome, url) {
    this.fetcher = fetcher
    this.track = track
    this.genome = genome
    this.url = url
  }
  read (arg) {
    const desc = [{
        "genome" : this.genome.path,
        "track" : this.track,
        "regions" : arg
    }]
    const qstring = encodeURI(JSON.stringify(desc))
    const url = `${this.url}/fetch.cgi?datatype=gff&descriptors=${qstring}`
    return this.fetcher.fetch(url, 'gff')
  }
  readAll () {
    const arg = this.genome.chromosomes.map(c => c.name).join(' ')
    return this.read(arg)
  }
  readChromosome (c) {
    return this.read(c['name'])
  }
  readRange (c, s, e) {
    const arg = `${c['name']}:${s}-${e}`
    return this.read(arg)
  }
}
export {
    TabixFileReader
}
