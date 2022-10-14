// ---------------------------------------------------------------------
// Reader for a fasta track for a genome
//
class FastaReader {
  constructor (fetcher, track, genome, fetchUrl) {
    this.fetcher = fetcher
    this.genome = genome
    this.track = track
    this.fetchUrl = fetchUrl
  }
  read (descrs, filename) {
    const fparam = filename ? `&filename=${filename}` : ''
    const params = `datatype=fasta&descriptors=${encodeURI(JSON.stringify(descrs))}${fparam}`
    return this.fetcher.fetch(this.fetchUrl, 'text', params)
  }
  readAll () {
    throw "Not implemented. FastaReader cannot readAll()."
  }
  readRange (c, s, e, reverse) {
    if (!this.genome) throw "Method readRange not implemented by non-specific reader."
    const descr = {
      genome: this.genome.path,
      track: this.track,
      regions: `${c.name}:${s}-${e}`,
      reverse: Boolean(reverse)
    }
    const p = this.read([descr]).then(txt => {
      txt = txt.split('\n')
      txt.shift()
      return txt.join('')
    })
    return p
  }
}
export {
    FastaReader
}
