import u from '@/lib/utils'

// ---------------------------------------------------------------------
class ChunkedFileReader {
  constructor (type, fetcher, name, chunkSize, genome, url) {
    this.fetcher = fetcher
    this.name = name
    this.chunkSize = chunkSize
    this.genome = genome
    this.url = url
    this.type = type
    this.holes = {} // chromosome -> set of block numbers
  }
  readAll () {
    if (this.chunkSize === 0) {
      return this.fetcher.fetch(`${this.url}/${this.name}/0.${this.type}`, this.type)
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
      // One file for the genome.
      url = `${this.url}/${this.name}/0.${this.type}`
      p = this.fetcher.fetch(url, this.type).then(data => data.filter(f => this.getChr(f) === c.name))
    } else if (this.chunkSize === 1) {
      // One file per chromosome.
      url = `${this.url}/${this.name}/${c.name}/0.${this.type}`
      p = this.fetcher.fetch(url, this.type)
    } else {
      // Chunked files (size = chunkSize) organized by chromosome.
      const minBlk = Math.max(0, Math.floor(s / this.chunkSize))
      const maxBlk = Math.max(minBlk, Math.floor(Math.min(e, c.length) / this.chunkSize))
      const ps = []
      for (let i = minBlk; i <= maxBlk; i++) {
        if (this.holes[c] && this.holes[c].has(i)) {
          continue
        }
        url = `${this.url}/${this.name}/${c.name}/${i}.${this.type}`
        ps.push(this.fetcher.fetch(url, this.type))
      }
      p = Promise.allSettled(ps).then(results => {
        // Chunk files only exist where there is data. Here we deal with the
        // fact that there can be "holes" in the range of chunks. The list of promises
        // generated for the range of chunks will have some fulfilled and some rejected.
        // Keep/concatenate the fulfilled ones.
        const recs = u.concatAll(results.filter(r => r.status === "fulfilled").map(r => r.value))
        // Record the rejected ones and avoid requesting them in the future.
        results.forEach((r, i) => {
          if (r.status === "fulfilled") {
            return
          } else if (r.reason.startsWith("404:")) {
            const holes = this.holes[c] || new Set()
            holes.add(minBlk + i)
            this.holes[c] = holes
          }
        })
        // File chunking duplicates items that span chunk boundaries.
        // Here is where we deal with that.
        return u.uniqueItems(recs, r => this.getID(r))
      })
    }
    return p
  }
  readRange (c, s, e) {
    return this.readChunks(c, s, e).then(data => data.filter(f => this.getStart(f) <= e && this.getEnd(f) >= s))
  }
}

class ChunkedGff3FileReader extends ChunkedFileReader {
  constructor (fetcher, name, chunkSize, genome, url) {
     super('gff3', fetcher, name, chunkSize, genome, url) 
  }
  getID (rec) {
     return rec[8]['ID']
  }
  getChr (rec) {
      return rec[0]
  }
  getStart (rec) {
      return rec[3]
  }
  getEnd (rec) {
      return rec[4]
  }
}

class ChunkedVcfFileReader extends ChunkedFileReader {
  constructor (fetcher, name, chunkSize, genome, url) {
     super('vcf', fetcher, name, chunkSize, genome, url) 
  }
  getID (rec) {
     return rec[2]
  }
  getChr (rec) {
      return rec[0]
  }
  getStart (rec) {
      return rec[1]
  }
  getEnd (rec) {
      return rec[1] + rec[3].length - 1
  }
}

export {
    ChunkedGff3FileReader,
    ChunkedVcfFileReader
}
