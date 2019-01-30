import u from '@/lib/utils'
import { FeatureTrackReader } from '@/lib/TrackReader'

// ---------------------------------------------------------------------
// Implementation of a feature reader that reads chunked GFF3 files.
class ChunkedGff3FileReader extends FeatureTrackReader {
  readAll () {
    if (this.cfg.chunkSize === 0) {
      return u.fetch(`${this.url}/${this.name}/0`, 'gff3')
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
    if (this.cfg.chunkSize === 0) {
      url = `${this.url}/${this.name}/0`
      p = u.fetch(url, 'gff3').then(data => data.filter(f => f[0] === c.name))
    } else if (this.cfg.chunkSize === 1) {
      url = `${this.url}/${this.name}/${c.name}/0`
      p = u.fetch(url, 'gff3')
    } else {
      const minBlk = Math.floor(s / this.cfg.chunkSize)
      const maxBlk = Math.floor(e / this.cfg.chunkSize)
      const ps = []
      for (let i = minBlk; i <= maxBlk; i++) {
        url = `${this.url}/${this.name}/${c.name}/${i}`
        ps.push(u.fetch(url, 'gff3'))
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
