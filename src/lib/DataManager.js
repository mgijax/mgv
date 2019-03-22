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
  // Args:
  //   url - starting URL for finding genome info
  constructor (url) {
    this.cache = {} // { genome.name -> { chr.name -> P([ feats ]) } }
    this.pending = {} // genome.name -> pending promise
    this.id2feat = {} // ID -> feature
    this.cid2feats = {} // cID -> [ features ]
    this.symbol2feats = {} // symbol -> [ features ]
    this.greg = new GenomeRegistrar()
    this.genomes = this.greg.register(url)
  }
  getFeatureById (id) {
    return this.id2feat[id]
  }
  getFeaturesByCid (cid) {
    return this.cid2feats[cid]
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
    return this.genomes.then(genomes => {
      genomes.forEach((g, i) => {
        g.height = 60
        g.zoomY = i * g.height
        g.dragY = 0
      })
      return genomes
    })
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
    console.log('Registering', feats.length, 'features for', g.name, c.name)
    let freg = new FeatureRegistrar(g, c, this.id2feat, this.cid2feats, this.symbol2feats)
    let cfeats = feats.map(f => freg.register(f)).filter(x => x)
    this.cache[g.name][c.name] = cfeats
    this.assignLanes(cfeats)
    return cfeats
  }
  // Returns a promise for all the feature of the specified genome, as a list, sorted by
  // chr and start position.
  getAllFeatures (g) {
    return this.ensureFeatures(g).then(() => this.getAllFeaturesNow(g))
  }
  // Immediate version of getAllFeatures. Returns whatever is in the cache
  getAllFeaturesNow (g) {
    return u.concatAll(g.chromosomes.map(c => this.cache[g.name][c.name]))
  }
  // Returns a promise for the features in the specified range of the specified genome
  getGenes (g, c, s, e, includeTranscripts) {
    return this.ensureFeatures(g).then(() => {
      let feats = this.cache[g.name][c.name]
      feats = feats.filter(f => gc.overlaps(f, { chr: c, start: s, end: e }))
      if (includeTranscripts) {
        return this.getModels(g, c, s, e).then(tps => {
          const gid2tps = u.index(tps, t => t.gID, false)
          let needLayout = false
          feats.forEach(f => {
            if (f.transcripts.length) return
            const ftps = gid2tps[f.ID] || []
            ftps.forEach(t => f.transcripts.push(t))
            needLayout = true
          })
          if (needLayout) this.assignLanes(this.cache[g.name][c.name])
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
        return ts.map(t => {
          const exons = this._unpackExons(t)
          return {
            gID: t[8]['Parent'],
            ID: t[8]['ID'],
            exons: exons,
            start: Math.min.apply(null,exons.map(e => e.start)),
            end: Math.max.apply(null,exons.map(e => e.end)),
            cds: this._unpackCds(t[8]['cds'])
          }
        })
      })
    })
  }
  _unpackExons (t) {
    const exonsAttr = t[8]['exons']
    const ecoords = exonsAttr.split(',').map(s => s.split('_').map(s => parseInt(s)))
    return ecoords.map(ec => { return { start: t[3] + ec[0], end: t[3] + ec[0] + ec[1] - 1 } })
  }
  _unpackCds (cdsAttr) {
    if (!cdsAttr) return null
    const parts = cdsAttr.split('|')
    return {
      ID: parts[0],
      start: parseInt(parts[1]),
      end: parseInt(parts[2])
    }
  }
  // Returns a promise for the genomic sequence of the specified range for the specified genome
  getSequence (g, c, s, e, doRC) {
    return this.greg.getReader(g, 'sequences')
      .then(reader => reader ? reader.readRange(c, s, e) : '')
      .then(s => {
        s.seq = doRC ? reverseComplement(s.seq) : s.seq
        return s
      })
  }
  // Returns a promise for the sequence of the specified object
  getSequenceForObject(g, id, type, doRC, doPT) {
    return this.greg.getReader(g, 'sequences').then(reader => {
      return reader ? reader.getFastaForObject(id, type) : null
    }).then(s => {
        s.seq = doRC ? reverseComplement(s.seq) : doPT ? translate(s.seq) : s.seq
        return s
    })
  }
  //
  getSequences(descrs) {
    const ps = descrs.map(d => {
      if (d.ID) {
        return this.getSequenceForObject(d.genome, d.ID, d.type, d.reverseComplement, d.translate)
      } else {
        return this.getSequence(d.genome, d.chr, d.start, d.end, d.reverseComplement)
      }
    })
    return Promise.all(ps)
  }
  // Returns a promise for the urls that will fetch the each of the sequences described
  // by the given list of descriptors.
  getSequenceUrls(descrs) {
    const ps = descrs.map(d => {
      return this.greg.getReader(d.genome, 'sequences').then(reader => {
        const dd = Object.assign({}, d)
        dd.genome = d.genome.name
        if (dd.chr) dd.chr = d.chr.name
        dd.url = null
        if (reader && reader.mine) {
          if (d.ID) {
            dd.url = reader.mine.getFastaUrl(d.ID, d.type, true)
          } else {
            dd.url = reader.mine.getChromosomeSliceUrl(d.genome, d.chr, d.start, d.end)
          }
        }
        return dd
      })
    })
    return Promise.all(ps)
  }
  // Returns the genologs of feature f from the specified genomes in the specified order.
  // If a genolog does not exist in a given genome, that entry in the returned list === undefined.
  getGenologs (f, genomes) {
    let feats
    if (typeof f === 'string') {
      f = (this.getFeaturesBy(f) || [])[0]
    }
    if (!f) {
      return []
    }
    if (f.cID) {
      feats = this.cid2feats[f.cID]
    } else {
      feats = [f]
    }
    let fix = u.index(feats, f => f.genome.name)
    let genologs = genomes.map(g => fix[g.name])
    return genologs
  }
  // Returns the genolog of feature f from genome g, or undefined if none exists
  getGenolog (f, g) {
    return this.getGenologs(f, [g])[0]
  }
  //
  assignLanes (feats) {
    const ca = new ContigAssigner()
    const slap = new SwimLaneAssigner()
    const slam = new SwimLaneAssigner()
    const fp = new FeaturePacker(0, 15000)
    feats.forEach(f => {
      const sla = f.strand === '+' ? slap : slam
      f.layout.contig = ca.assignNext(f.start, f.end)
      f.layout.l1 = sla.assignNext(f.start, f.end)
      f.layout.l2 = fp.assignNext(f.start, f.end, Math.max(1, f.transcripts.length), f.ID)
    })
  }

}
// Registers features for one chromsome of a genome
class FeatureRegistrar {
  constructor (g, c, id2f, cid2f, sym2f) {
    // each chromosome of each genome has its own registrar
    this.genome = g
    this.chr = c
    // map feature.ID => feature
    this.id2feat = id2f
    // map feature.cID => [ features ]
    this.cid2feats = cid2f
    // map feature.symbol => [ features ]
    this.symbol2feats = sym2f
  }
  // Args:
  //   r - a parsed GFF3 record
  register (r) {
    const f = gff3.record2object(r)
    f.transcripts = []
    f.sotype = f.type
    delete f.score
    delete f.phase
    delete f.type
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
