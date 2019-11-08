/*
 * DataManager
 *
 * The thing the app talks to when it needs genomic data. It interacts with a
 * DataSource to get "raw" data from the server (or wherever). It processes the
 * responses (eg, registers features, builds indices, etc) and maintains them in a cache,
 *
 * FIXME: some methods return promises and some methods return data directly.
 * Should adopt a naming convention so that caller knows which, eg, getFoo vs getFooP
 * or getPfFoo (get promise for foo)
 */
import gc from '@/lib/GenomeCoordinates'
import u from '@/lib/utils'
import { SwimLaneAssigner, FeaturePacker, ContigAssigner } from '@/lib/Layout'
import config from '@/config'
import { GenomeRegistrar } from '@/lib/GenomeRegistrar'
import gff3 from '@/lib/gff3lite'
import { translate, reverseComplement } from '@/lib/genetic_code'

class DataManager {
  constructor (app) {
    this.app = app
    this.url = this.app.runtimeConfig.dataUrl
    this.fetchUrl = this.url + "fetch.cgi"
    this.cache = {} // { genome.name -> { chr.name -> [features] } }
    this.pending = {} // genome.name -> pending promise
    this.id2feat = {} // ID -> feature
    this.cid2feats = {} // cID -> [ features ]
    this.hid2feats = {} // hID -> [ features ]
    this.symbol2feats = {} // symbol -> [ features ]
    this.greg = new GenomeRegistrar()
    this.genomes = this.greg.register(this.url)
  }
  getFeatureById (id) {
    return this.id2feat[id]
  }
  getFeaturesByCid (cid) {
    return this.cid2feats[cid]
  }
  getFeaturesByHid (hid) {
    return this.hid2feats[hid]
  }
  getFeaturesBySymbol (symbol) {
    return this.symbol2feats[symbol.toLowerCase()]
  }
  getFeaturesBy (val) {
    let f = this.getFeatureById(val)
    if (f) return [f]
    return this.getFeaturesByCid(val) || this.getFeaturesBySymbol(val) || []
  }
  //
  lookupGenome (n) {
    return this.greg.lookupGenome(n)
  }
  // Returns a promise for all the genomes we know about.
  getGenomes () {
    return this.genomes
  }
  // Returns a promise that resolves when all features of genome g have been loaded and registered.
  // After resolution, one may access the features of chromosome c of genome g via this.cache[g.name][c.name]
  ensureFeatures (g) {
    //
    if (this.pending[g.name]) return this.pending[g.name]
    if (this.cache[g.name]) return Promise.resolve(true)
    //
    this.cache[g.name] = {}
    this.pending[g.name] = this.greg.getReader(g, 'genes').then(reader => {
      return reader.readAll().then(recs => {
        let prevChr = null
        let feats = []
        let allFeats = []
        recs.forEach(r => {
          if (!prevChr || r[0] !== prevChr.name) {
            if (feats.length) {
              allFeats.push(this._registerChr(g, prevChr, feats))
            }
            prevChr = g.name2chr[r[0]]
            if (!prevChr) u.fail("Could not find chromosome " + r[0])
            feats = [r]
          }
          else {
            feats.push(r)
          }
        })
        if (feats.length) allFeats.push(this._registerChr(g, prevChr, feats))
        delete this.pending[g.name]
        return allFeats
      })
    })
    return this.pending[g.name]
  }
  //
  _registerChr (g, c, feats) {
    let freg = new FeatureRegistrar(g, c, this.id2feat, this.cid2feats, this.hid2feats, this.symbol2feats)
    let cfeats = feats.map(f => freg.register(f)).filter(x => x)
    this.cache[g.name][c.name] = cfeats
    return cfeats
  }
  // Returns a promise for all the feature of the specified genome, as a list, sorted by
  // chr and start position.
  getAllFeatures (g, c) {
    return this.ensureFeatures(g).then(() => this.getAllFeaturesNow(g, c))
  }
  // Immediate version of getAllFeatures. Returns whatever is in the cache
  getAllFeaturesNow (g, c) {
    return u.concatAll(g.chromosomes.filter(
           cc => (!c || c === cc) ? cc : null).map(
           cc => this.cache[g.name][cc.name]))
  }
  // Returns a promise for the features in the specified range of the specified genome
  getGenes (g, c, s, e, includeTranscripts) {
    return this.ensureFeatures(g).then(() => {
      let feats = this.cache[g.name][c.name]
      feats = feats.filter(f => gc.overlaps(f, { chr: c, start: s, end: e }))
      if (includeTranscripts) {
        return this.getModels(g, c, s, e).then(tps => {
          // The getModels call returns all transcripts in the region.
          // Here we attach them to their genes.
          // Index the transcripts by gene ID.
          const gid2tps = u.index(tps, t => t.gID, false)
          let needLayout = false
          feats.forEach(f => {
            // if we've already got the transcripts for this gene, skip
            if (f.transcripts.length) return
            const ftps = gid2tps[f.ID] || []
            // add each transcript to it's gene's list
            ftps.forEach(t => f.transcripts.push(t))
            // Build the composite transcript for the gene from the real transcripts.
            // If none, build a "fake" composite of a single exon covering the gene.
            const c = this._computedExons(f.transcripts)
            const cT = c.composite.length ? {
              gID: f.ID,
              ID: f.ID + "_composite",
              exons: c.composite,
              dExons: c.distinct,
              start: c.composite[0].start,
              end: c.composite[c.composite.length - 1].end,
              length: c.composite.reduce((l,x) => l + x.end - x.start + 1, 0),
              cds: null
            } : {
              gID: f.ID,
              ID: f.ID + "_composite",
              exons: [{start: f.start, end: f.end}],
              dExons: [{start: f.start, end: f.end}],
              start: f.start,
              end: f.end,
              length: f.end - f.start + 1,
              cds: null
            }
            Object.assign(f.composite, cT)
            //f.transcripts.push(cT)
            needLayout = true
          })
          return feats
        })
      }
      return feats
    })
  }
  // Returns a promise for the transcripts of features that overlap the 
  // specified range of the specified genome. Each transcript includes
  // its exons. Coding transcripts also contain the coordinates of the
  // start and stop codons.
  getModels (g, c, s, e) {
    return this.greg.getReader(g, 'transcripts').then(reader => {
      return reader.readRange(c, s, e).then(ts => {
        const val = ts.map(t => {
          const exons = this._unpackExons(t)
          const tlen = exons.reduce((l,x) => l + x.end - x.start + 1, 0)
          const cds = this._unpackCds(t[8]['cds'], tlen, exons)
          const tt= {
            gID: t[8]['Parent'],
            ID: t[8]['ID'],
            exons: exons,
            start: Math.min.apply(null,exons.map(e => e.start)),
            end: Math.max.apply(null,exons.map(e => e.end)),
            strand: t[6],
            length: tlen,
            cds: cds
          }
          return tt
        }).sort((a,b) => {
          if (a.strand === '+') {
            return a.start !== b.start ? a.start - b.start : b.length - a.length
          } else {
            return a.end !== b.end ? b.end - a.end : b.length - a.length
          }
        })
        return val
      })
    })
  }
  // Exons of a transcript are encoded as a string such as "0_110,2100_344,..."
  // where for each N_M item, N is the offset of the exon from the start of the transcript
  // and M is the exon's length.
  // Here we parse the string and produce a list of exons each with full start and end coordinates.
  _unpackExons (t) {
    const exonsAttr = t[8]['exons']
    if (!exonsAttr) {
      return [{start: t[3], end: t[4]}]
    }
    const ecoords = exonsAttr.split(',').map(s => s.split('_').map(s => parseInt(s)))
    return ecoords.map(ec => { return { start: t[3] + ec[0], end: t[3] + ec[0] + ec[1] - 1 } })
  }
  // CDSs of a transcript are encoded as "ID|start|end", where ID is the CDSs ID and start and end are
  // the positions of the start and stop codons. (Reminder: Coordinates are always forward strand. To know
  // which is the start codon and which is the stop codon, you have to look at the strand of the gene.)
  _unpackCds (cdsAttr, tlen, exons) {
    if (!cdsAttr) return null
    const parts = cdsAttr.split('|')
    const c = {
      ID: parts[0],
      start: parseInt(parts[1]),
      end: parseInt(parts[2])
    }
    // compute the length of the CDS by adding up the included exons (taking care not to
    // include UTRs)
    c.pieces = exons.reduce((a,x) => {
      if (c.start <= x.end && c.end >= x.start) {
        const piece = { start: Math.max(c.start, x.start), end: Math.min(c.end, x.end) }
        a.push(piece)
      }
      return a
    }, [])
    c.length = c.pieces.reduce((a,x) => a + x.end - x.start + 1, 0)
    return c
  }
  // Given transcripts for a gene, returns an object containing (1) the "distinct" exons, and 
  // (2) the "composite" exons
  _computedExons (tps) {
    const cExons = [] // composite exons
    const dExons = new Set() // distinct exons
    const allExons = tps.reduce((a,t) => a.concat(t.exons), [])
    allExons.sort((e1, e2) => e1.start - e2.start)
    let ccontig = null
    let hwm = 0
    allExons.forEach(e => {
      // composite
      const lastE = cExons[cExons.length - 1]
      if (!lastE || lastE.end < e.start) {
        cExons.push({start: e.start, end: e.end, length: e.end - e.start + 1})
      } else {
        lastE.end = Math.max(lastE.end, e.end)
      }
      // distinct
      dExons.add(`${e.start}_${e.end}`)
    })
    return {
      distinct: Array.from(dExons).map(de => {
          const bits = de.split('_')
          const start = parseInt(bits[0])
          const end = parseInt(bits[1])
          const length = end - start + 1
          return { start, end, length };
      }).sort((a,b) => a.start - b.start),
      composite: cExons
    }
  }
  getSequences (descrs, filename) {
    const fparam = filename ? `&filename=${filename}` : ''
    const params = `descriptors=${JSON.stringify(descrs)}${fparam}`
    return u.fetch(this.fetchUrl, 'text', params)
  }
  // 
  // Returns a promise for the genomic sequence of the specified range for the specified genome
  getSequence (g, c, s, e, doRC) {
    const descr = {
      header: `>${g.name}::${c.name}:${s}..${e}`,
      genome: g.name,
      genomeUrl: g.url,
      chromosome: c.name,
      start: s,
      length: e - s + 1,
      reverseComplement: Boolean(doRC),
      type: "dna"
    }
    const p = this.getSequences([descr]).then(txt => {
      txt = txt.split('\n')
      txt.shift()
      return txt.join('')
    })
    return p
  }
  //
  // A sequence descriptor specifies arbitrary slice(s) of a chromosome,
  // and whether to reverse complement and/or translate the sequence.
  // The descriptor is an object with these fields:
  // - header (string) The header line for the sequence.
  // - genome (string) name of the genome
  // - chromosome (string) the chromosome
  // - start (int) start coordinate(s)
  // - length (int) length(s) of the region(s)
  // - type (string) one of: 'dna', 'composite transcript', 'transcript', 'cds'
  // - reverseComplement (boolean) True iff the sequence should be reverse complemented 
  // - translate (boolean) True iff the sequence should be translated to protein
  // - selected (boolean) True iff the sequence is in the selected state
  //
  makeSequenceDescriptor (stype, f, t) {
    const target = stype === 'dna' ? f : stype === 'composite transcript' ? f : stype === 'transcript' ? t : t.cds
    const id = target.ID
    const len = target.length
    const sym = f.symbol || ''
    const gn = f.genome.name
    const parts = target.pieces || target.exons || [f]
    const starts = parts.map(p => p.start)
    const lengths = parts.map(p => p.end - p.start + 1)
    const d = {
      header: `${gn}::${id} ${sym} (${stype})`,
      ID: id,
      genome: f.genome.name,
      genomeUrl: f.genome.url,
      type: stype,
      chromosome: f.chr.name,
      start: starts,
      length: lengths,
      totalLength: len,
      selected: true,
      reverseComplement: f.strand === '-',
      translate: false
    }
    return d
  }
  // Returns true iff genomes ga and gb are equivalent
  equivalentGenomes (ga, gb) {
    const txa = ga.metadata.taxonid
    const txb = gb.metadata.taxonid
    return txa === txb || 
      // FIXME: hardcoded special case for mouse subspecies.
      (txa.startsWith('100') && txa.length === 5 && txb.startsWith('100') && txb.length === 5)
  }
  // Returns true iff feature a and b are equivalent
  equivalent (a, b) {
    const eqgs = this.equivalentGenomes(a.genome, b.genome)
    return a === b ||
      a.ID === b.ID ||
      a.cID && a.cID === b.cID ||
      a.hID && a.hID === b.hID && (!eqgs || this.app.includeParalogs)
  }
  // Returns true iff features a and b are paralogs
  paralogs (a, b) {
    return a.hID &&
        a.hID === b.hID && 
        a.cID !== b.cID &&
        this.equivalentGenomes(a.genome, b.genome)
  }
  // Returns a list of the homologs of feature f from the specified genomes in the specified order.
  // If a homolog does not exist in a given genome, that entry in the returned list === undefined.
  getHomologs (f, genomes) {
    if (typeof(f) === 'string') {
      f = (this.getFeaturesBy(f) || [])[0]
    }
    if (!f) {
      return []
    }
    const homs = genomes.map(g => {
      const eqgs = this.equivalentGenomes(f.genome, g)
      let gfeats
      if (!eqgs || (this.app.includeParalogs && f.hID)) {
        gfeats = this.hid2feats[f.hID]
      } else if (f.cID) {
        gfeats = this.cid2feats[f.cID] 
      } else if (g === f.genome) {
        gfeats = [f]
      }
      return (gfeats || []).filter(ff => ff.genome === g)
    })

    return homs.reduce((a,v) => a.concat(v), [])
  }
  // Returns the homologs of feature f from genome g, or undefined if none exists
  // If there is more than one homologs, an arbitrary one is returned.
  getHomolog (f, g) {
    return this.getHomologs(f, [g])[0]
  }
  //
  assignLanes (feats, ppb, fsize) {
    const ca = new ContigAssigner()
    const slap = new SwimLaneAssigner()
    const slam = new SwimLaneAssigner()
    const fp = new FeaturePacker(0, 1000)
    feats.forEach(f => {
      const lbl = f.symbol || f.ID
      const lblLenBp = ppb ? lbl.length * fsize / ppb : 0 
      const start = f.start
      const end = Math.max(f.end, start + lblLenBp - 1)
      const sla = f.strand === '+' ? slap : slam
      f.layout.contig = ca.assignNext(start, end)
      f.layout.l1 = sla.assignNext(start, end)
      f.layout.l2 = fp.assignNext(start, end, 1 + f.transcripts.length, f.ID)
    })  
  }
  //
  flushAllGenomeData () {
    this.app.allGenomes.forEach(g => this.flushGenome(g))
  }
  //
  flushGenome (g) {
     const gn = g.name || g
     const gcache = this.cache[gn]
     if (gcache) {
       delete this.cache[gn]
       for (let cn in gcache) {
         const cfeats = gcache[cn]
         cfeats.forEach(f => {
           delete this.id2feat[f.ID]
           const cidFeats = this.cid2feats[f.cID]
           if (cidFeats) {
             this.cid2feats[f.cID] = cidFeats.filter(ff => ff !== f)
             if (this.cid2feats[f.cID].length === 0) {
                delete this.cid2feats[f.cID]
             }
           }
           const hidFeats = this.hid2feats[f.hID]
           if (hidFeats) {
             this.hid2feats[f.hID] = hidFeats.filter(ff => ff !== f)
             if (this.hid2feats[f.hID].length === 0) {
                delete this.hid2feats[f.hID]
             }
           }
           if (f.symbol) {
             const fs = f.symbol.toLowerCase()
             this.symbol2feats[fs] = this.symbol2feats[fs].filter(ff => ff !== f)
             if (this.symbol2feats[fs].length === 0) {
               delete this.symbol2feats[fs]
             }
           }
         }, this)
       }
     }
  }
}
// Registers features for one chromsome of a genome
class FeatureRegistrar {
  constructor (g, c, id2f, cid2f, hid2f, sym2f) {
    // each chromosome of each genome has its own registrar
    this.genome = g
    this.chr = c
    // map feature.ID => feature
    this.id2feat = id2f
    // map feature.cID => [ features ]
    this.cid2feats = cid2f
    // map feature.hID => [ features ]
    this.hid2feats = hid2f
    // map feature.symbol => [ features ]
    this.symbol2feats = sym2f
  }
  // Args:
  //   r - a parsed GFF3 record
  register (r) {
    const f = gff3.record2object(r)
    f.transcripts = []
    f.composite = {}
    f.sotype = f.type
    // delete f.score
    // delete f.phase
    // delete f.type
    f.genome = this.genome
    f.chr = this.chr
    //
    f.length = f.end - f.start + 1
    if (f.length > config.DataManager.featureSizeLimit) {
      console.log('Feature too big. Skipping: ', f)
      return null
    }
    // A place to store layout attributes (such as swim lanes). Unlike
    // the feature, the layout object is not frozen, so layout can be recalculated at any time.
    // However because the owning object IS frozen, the layout objects will NOT be observed by vuejs.
    // (This is a good thing.)
    f.layout = {}
    //
    this.id2feat[f.ID] = f
    if (f.cID) {
      let d = this.cid2feats[f.cID]
      if (!d) d = this.cid2feats[f.cID] = []
      d.push(f)
    } else {
      f.cID = null // make sure it's not undefined
    }
    //
    if (f.hID) {
      let d = this.hid2feats[f.hID]
      if (!d) d = this.hid2feats[f.hID] = []
      d.push(f)
    } else {
      f.hID = null // make sure it's not undefined
    }
    //
    f.symbol = f.symbol || f.Name
    //
    if (f.symbol) {
      let lc = f.symbol.toLowerCase()
      let d = this.symbol2feats[lc]
      if (!d) d = this.symbol2feats[lc] = []
      d.push(f)
    }
    // For convenience...
    f.id = f.cID || f.ID
    f.label = f.symbol || f.id
    // For performance. Don't want to observe 10,000s of objects.
    // Vue is not reactive to frozen objects.
    Object.freeze(f)
    //
    return f
  }
}

export default DataManager
