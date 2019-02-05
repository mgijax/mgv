/*

Concepts/definitions:

Genome features - a list
 - each feature has ID, chr, start, end, strand. May have cID (canonical ID)
 - sorted by chr + start

Block - a contiguous sub-sequence of features from the genome feature list
 - a block has a start (index into the feature list) and length (number of features)
 - the coordinates of a block are the min start / max end coordinates of its features
 - the length is always > 0 (?)
 - a block may not cross a chr boundary (check all features have the same chr)

Contig - a custer of mutually overlapping features
 - a connected component of the graph induced by the overlaps relation

Contig block - a block consisting of the members of a contig.

Block cover - list of nonoverlapping blocks that covers a genome
 - every feature belongs to exactly one block
 - blocks in a cover are numbered 1, 2, 3...
   - accessed as b.index
   - extra increment at chromosome breaks. Ie, the first block on each chr bumps the counter by an extra 1

Contig cover - a block cover consisting entirely of contig blocks

Neighbor joining - when two neighboring blocks in a cover are merged
 - neighbor joining preserves the cover (ie, it's still a block cover)

Block cover join - the bidirectional outer-join of the blocks in two block covers
 - ie, a table of <a, b> pairs where:
   - a is a block from genome A and b is a block from genome B and a joins with b, or
   - a is a block from genome A and b is null, or
   - a is null and b is a block from genome B
 - a block from genome A joins with a block from genome B if they contain features that have the same canonical id

Connected components (cc's) of the join
 - induced by the block cover join binary relation
 - each cc has a cardinality, one of 1:1, 1:n, n:1, n:m, 0:1, 1:0
   - in a perfect world, every cc would be 1:1
   - various causes for n > 1
     - duplications (mult features in one genome have the same canonical ID)
     - features in one block of genome A join to features in multiple blocks in genome B

Connected component reduction - applying all possible neighbor joins to blocks on the 'n' side of a 1:n or n:1 cc in an attempt to convert it to a 1:1

Algorithm:
 1. build a contig cover for genome A and a contig cover for genome B
 2. join the covers
 3. generate the cc's
 4. reduce the cc's
 5. merge neighboring cc's

*/

import u from '@/lib/utils'

//
class Genome {
  constructor (n, feats) {
    this.name = n
    this.features = feats
  }
}
//
class Block {
  constructor (g, i, n, index) {
    this.genome = g
    this.istart = i
    this.length = n
    this.index = index
    this.validate()
    //
    this.chromosome = this.genome.features[this.istart].chr
    this.start = Math.min.apply(null, this.features.map(f => f.start))
    this.end = Math.max.apply(null, this.features.map(f => f.end))
    //
    this.ori = null
    this.partners = new Set()
  }
  get features () {
    return this.genome.features.slice(this.istart, this.istart + this.length)
  }
  clone () {
    let c = new Block(this.genome, this.istart, this.length, this.index)
    c.partners = new Set(this.partners)
    return c
  }
  // Returns '+' if other is my downstream neighbor, otherwise returns '-' if
  // other is my upstream neighbor, otherwise returns false
  hasNeighbor (other) {
    if (this.genome !== other.genome) return false
    if (this.chromosome !== other.chromosome) return false
    if (this.istart + this.length === other.istart) return '+'
    if (other.istart + other.length === this.istart) return '-'
    return false
  }
  // Merges the other block (which must be a neighbor) into this block.
  // 'Destroys' the other block.
  merge (other) {
    // u.assert(this.hasNeighbor(other), 'Has neighbor')
    this.istart = Math.min(this.istart, other.istart)
    this.start = Math.min(this.start, other.start)
    this.end = Math.max(this.end, other.end)
    this.length += other.length
    this.ori = this.combineOri(this.ori, other.ori)
    other.partners.forEach(p => {
      this.partners.add(p)
      p.partners.add(this)
      p.partners.delete(other)
    })
    other.partners = null
    other.istart = -1
    other.chromosome = null
    other.start = -1
    other.end = -1
    other.length = -1
  }
  validate () {
    u.assert(this.genome, 'Genome exists.')
    let fs = this.genome.features
    u.assert(fs, 'Genome has features.')
    u.assert(this.istart >= 0, 'Start >= 0')
    u.assert(this.length > 0, 'Length > 0')
    u.assert(this.istart + this.length <= this.genome.features.length, 'Bounds check.')
    u.assert(fs[this.istart].chr === fs[this.istart + this.length - 1].chr, 'Chromomse boundary check.')
  }
  combineOri (o1, o2) {
    if (!o1) return o2
    if (!o2) return o1
    if (o1 === o2) return o1
    return '?'
  }
  // Sets orientation of this block relative to its join partner.
  setOri () {
    let o = null
    this.partners.forEach(p => {
      o = this.combineOri(o, this.getOri(p))
    })
    this.ori = o
  }
  // Returns the relative orientation of this block relative to another.
  // If all features that join via cID between the blocks are on the same strand,
  // returns '+'. If they are all on opposite strands, orientation is '-'.
  // If some of each, orientation is '?'.
  // If no features join between the blocks, returns null.
  getOri (other) {
    let aix = this.features.reduce((ix, f) => {
      if (f.cID) ix[f.cID] = f.strand
      return ix
    }, {})
    return other.features.reduce((ori, bf) => {
      let astrand = aix[bf.cID]
      if (!astrand) return ori
      let o = astrand === bf.strand ? '+' : '-'
      return ori === null ? o : ori === o ? ori : '?'
    }, null)
  }
}
//
// A list of blocks that covers a genome
class BlockCover {
  constructor (g, blks) {
    this.genome = g
    this.blocks = blks
    this.joinedTo = null
    if (this.blocks) this.renumber()
  }
  getBlocksInRange (chr, start, end) {
    return this.blocks.filter(b => b.chromosome.name === chr && b.start <= end && b.end >= start)
  }
  translate (chr, start, end) {
    let mapped = []
    let blks = this.getBlocksInRange(chr, start, end)
    blks.forEach(b => {
      let s = Math.min(Math.max(start, b.start), b.end)
      let e = Math.max(Math.min(end, b.end), b.start)
      let ds = s - b.start
      let blen = b.end - b.start + 1
      let rlen = e - s + 1
      b.partners.forEach(p => {
        let plen = p.end - p.start + 1
        let r = plen / blen
        let ns = p.start + Math.floor(ds * r)
        mapped.push({
          genome: p.genome,
          chr: p.chromosome,
          start: ns,
          end: ns + Math.floor(rlen * r) - 1,
          index: p.index,
          ori: p.ori
        })
      })
    })
    return mapped
  }
  // Ensures this is a valid cover:
  validate () {
    this.blocks.forEach((b, i) => {
      if (i === 0) {
        u.assert(b.istart === 0, 'First block start')
      } else {
        let prev = this.blocks[i - 1]
        u.assert(b.istart === prev.istart + prev.length, 'Next block start')
      }
      if (i === this.blocks.length - 1) {
        u.assert(b.istart + b.length === this.genome.features.length, 'Last block end')
      }
    })
    return this
  }
  // Numbers the block in this cover from 1 .. n
  renumber () {
    this.blocks = this.blocks.filter(b => b.istart !== -1)
    this.blocks.forEach((b, i) => { b.index = i })
    this.validate()
  }
  // Initializes self with a cover consisting of this contigs for its genome.
  // Assumes features have already been marked with their contig number
  makeContigCover () {
    this.blocks = this.genome.features.reduce((cover, feat, i, feats) => {
      if (i === 0 || feat.layout.contig !== feats[i - 1].layout.contig) {
        cover.push(new Block(this.genome, i, 1, cover.length))
      } else {
        cover[cover.length - 1].length += 1
      }
      return cover
    }, [])
    return this
  }
  // Builds an index mapping canonical IDs to sets of blocks containing
  // features with those IDs
  index () {
    return this.blocks.reduce((ix, blk) => {
      blk.features.forEach(f => {
        if (!f.cID) return
        if (ix[f.cID]) {
          ix[f.cID].add(blk)
        } else {
          ix[f.cID] = new Set([blk])
        }
      })
      return ix
    }, {})
  }
  // Joins two block covers. Result is that each block is given a new set attribute,
  // partners, containing the blocks in the other cover that it joins to.
  join (other) {
    //
    this.joinedTo = other
    other.joinedTo = this
    //
    this.blocks.forEach(b => b.partners.clear())
    other.blocks.forEach(b => b.partners.clear())
    //
    let aix = this.index()
    other.blocks.forEach(bblk => {
      bblk.features.forEach(f => {
        (aix[f.cID] || []).forEach(ablk => {
          ablk.partners.add(bblk)
          bblk.partners.add(ablk)
        })
      })
    })
  }
  // Looks for 1:0 blocks (ie blocks that didn't join to anything in the other genome)
  // Merge these blocks with their neighbors.
  merge1to0s () {
    let last = null
    this.blocks.forEach(b => {
      if (last && b.chromosome !== last.chromosome) last = null
      if (b.partners.size === 0 && last) b.merge(last)
      last = b
    })
    this.renumber()
  }
  // Looks for 1:n blocks and tries to reduce it to a 1:1 by
  // merging the blocks on the n size.
  merge1toNs () {
    u.assert(this.joinedTo !== null, 'Cover is joined')
    this.blocks.forEach(ablk => {
      if (ablk.partners.size <= 1) return
      let pards = Array.from(ablk.partners)
      if (pards.some(p => p.partners.size !== 1)) return
      // if here, we found a 1:n
      pards.sort((a, b) => a.index - b.index)
      let pp
      pards.forEach(p => {
        if (pp && pp.hasNeighbor(p)) p.merge(pp)
        pp = p
      })
    })
    this.joinedTo.renumber()
  }
  // Looks for successive 1:1 pairs and merges them into a single 1:1 pair
  merge1to1s () {
    let other = this.joinedTo
    u.assert(other !== null, 'Cover is joined')
    //
    this.blocks.forEach(b => b.setOri())
    other.blocks.forEach(b => b.setOri())
    //
    this.blocks.forEach((ablk, i) => {
      if (i === 0) return
      let aprev = this.blocks[i - 1]
      if (ablk.partners.size !== 1 || aprev.partners.size !== 1) return
      let bblk = Array.from(ablk.partners)[0]
      let bprev = Array.from(aprev.partners)[0]
      if (bblk.partners.size !== 1 || bprev.partners.size !== 1) return
      // Found successinve 1:1's
      //    aprev--bprev
      //    ablk--bblk
      // We know aprev and ablk are neighbors.
      // If bprev and bblk are neighbors with the same orientation, we can merge
      if (bprev.hasNeighbor(bblk) && bprev.ori === bblk.ori) {
        ablk.merge(aprev)
        bblk.merge(bprev)
      }
    })
    // remove dead blocks, renumber, and revalidate
    this.renumber()
    other.renumber()
  }
  //
  getConnectedComponents (other) {
    let visited = new Set()
    function _ (b, cc, i) {
      if (visited.has(b)) return cc
      visited.add(b)
      cc[i].push(b)
      b.cc = cc
      b.partners.forEach(p => _(p, cc, 1 - i))
      return cc
    }
    //
    let ccs = this.blocks.map(b => {
      if (visited.has(b)) return null
      return _(b, [[], []], 0)
    }).filter(x => x)
    // Fill in 0:1's
    other.blocks.forEach(b => {
      if (!visited.has(b)) {
        let cc = [[], [b]]
        b.cc = cc
        ccs.push(cc)
      }
    })
    //
    ccs.forEach(cc => {
      let s = [cc[0].map(b => b.index).join(','), cc[1].map(b => b.index).join(',')].join('::')
      cc.push(s)
    })
    //
    return ccs
  }
}
//
function generateSyntenyBlocks (aName, aFeats, bName, bFeats) {
  // Build a contig block cover for genome A
  let ga = new Genome(aName, aFeats)
  let aCover = new BlockCover(ga).makeContigCover()
  // Build a contig block cover for genome B
  let gb = new Genome(bName, bFeats)
  let bCover = new BlockCover(gb).makeContigCover()
  // Join the blocks (by joining their features)
  aCover.join(bCover)
  // Merge 1:0 blocks with their neighbors
  aCover.merge1to0s()
  bCover.merge1to0s()
  // Try to convert 1:n's into 1:1's by merging the n blocks when possible
  aCover.merge1toNs()
  bCover.merge1toNs()
  // Merge successive 1:1's into larger 1:1's
  // (Unlike the above calls, this one affects both covers at once.)
  aCover.merge1to1s()
  //
  return [aCover, bCover]
}
//
export {
  generateSyntenyBlocks
}
