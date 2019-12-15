import u from '@/lib/utils'

// ---------------------------------------------------------------------
class ChunkedGff3FileReader {
  constructor (fetcher, name, chunkSize, genome) {
    this.fetcher = fetcher
    this.name = name
    this.chunkSize = chunkSize
    this.genome = genome
    this.url = genome.url
  }
  readAll () {
    if (this.chunkSize === 0) {
      return this.fetcher.fetch(`${this.url}/${this.name}/0.gff3`, 'gff3')
    } else {
      const ps = this.genome.chromosomes.map(c => this.readChromosome(c))
      return Promise.all(ps).then(u.concatAll)
    }
  }
  readChromosome (c) {
    return this.readRange(c, 1, c.length)
  }
  readChunks (c, s, e) {
    let url
    let p
    if (this.chunkSize === 0) {
      url = `${this.url}/${this.name}/0.gff3`
      p = this.fetcher.fetch(url, 'gff3').then(data => data.filter(f => f[0] === c.name))
    } else if (this.chunkSize === 1) {
      url = `${this.url}/${this.name}/${c.name}/0.gff3`
      p = this.fetcher.fetch(url, 'gff3')
    } else {
      const minBlk = Math.max(0, Math.floor(s / this.chunkSize))
      const maxBlk = Math.max(minBlk, Math.floor(Math.min(e, c.length) / this.chunkSize))
      const ps = []
      for (let i = minBlk; i <= maxBlk; i++) {
        url = `${this.url}/${this.name}/${c.name}/${i}.gff3`
        ps.push(this.fetcher.fetch(url, 'gff3'))
      }
      p = Promise.all(ps).then(u.concatAll).then(recs => {
        // File chunking duplicates items that span chunk boundaries.
        // Here is where we deal with that.
        return u.uniqueItems(recs, r => r[8]['ID'])
      })
    }
    return p
  }
  readRange (c, s, e) {
    return this.readChunks(c, s, e).then(data => data.filter(f => f[3] <= e && f[4] >= s))
  }
}

export default ChunkedGff3FileReader
