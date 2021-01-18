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
import config from '@/config'
import { GenomeRegistrar } from '@/lib/GenomeRegistrar'
import HomologyManager from '@/lib/HomologyManager'
import gff3 from '@/lib/gff3lite'

class DataManager {
  constructor (app) {
    this.app = app
    this.url = this.app.runtimeConfig.dataUrl
    this.fetchUrl = this.url + "fetch.cgi"
    this.cache = {} // { genome.name -> { chr.name -> [features] } }
    this.pending = {} // genome.name -> pending promise
    this.id2feat = {} // ID -> feature
    this.cid2feats = {} // cID -> [ features ]
    this.symbol2feats = {} // symbol -> [ features ]
    this.greg = new GenomeRegistrar()
    this.genomes = this.greg.register(this.url)
    this.homologyManager = new HomologyManager(this, this.url)
  }
  getGenomeByName (n) {
    return this.greg.lookupGenome(n)
  }
  getFeatureById (id) {
    return this.id2feat[id]
  }
  getFeaturesByCid (cid) {
    return this.cid2feats[cid] || []
  }
  getFeaturesBySymbol (symbol) {
    return this.symbol2feats[symbol.toLowerCase()] || []
  }
  getFeaturesBy (val) {
    let f = this.getFeatureById(val)
    if (f) return [f]
    let fs = this.getFeaturesByCid(val)
    if (fs.length > 0) return fs
    fs = this.getFeaturesBySymbol(val)
    if (fs.length > 0) return fs
    return []
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
    const txid = this.fixTaxonId(g.metadata.taxonid)
    const hp = this.homologyManager.loadHomologiesForTaxon(txid)
    //
    this.cache[g.name] = {}
    this.pending[g.name] = this.greg.getReader(g, 'genes').then(reader => {
      this.app.$root.$emit('message', { message: 'Loading ' + g.name + '...' })
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
        // calculate feature density (features per Mb) for each genome
        const totalFeats = allFeats.reduce((v,a) => v + a.length, 0)
        const totalGenomeLength = g.chromosomes.reduce((v,c) => v + c.length, 0)
        g.featureDensity = totalFeats / totalGenomeLength * 1000000
        return allFeats
      })
    })
    return hp.then(() => {
        this.homologyManager.computeAllInferredParalogs()
        return this.pending[g.name]
    })
  }
  //

  //
  _registerChr (g, c, feats) {
    let freg = new FeatureRegistrar(g, c, this.id2feat, this.cid2feats, this.symbol2feats)
    let cfeats = feats.map(f => freg.register(f)).filter(x => x)
    this.cache[g.name][c.name] = cfeats.sort((a,b) => a.start - b.start)
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
          })
          return feats
        })
      }
      return feats
    })
  }
  // Utility function for stripping the prefix from a curie style identifier
  stripPrefix (s) {
        return s.substr(s.indexOf(':')+1)
  }
  // Returns a promise for the variants in the specified range
  getVariants (g, c, s, e) {
    /*
     * Splits strings coding multiple values ala VEP output.
     * Strings may have 0, 1, or 2 levels of multiples
     *  0 : no multiples, string is returned unchanged
     *  1 : multiples separated by comma, eg "foo,bar,baz"
     *  2 : multiples separated by pipe of multiples separated by comma
     *      e.g. "foo1,foo2|bar1|baz1,baz2,baz3"
     */
    const splitString = function(s, levels) {
      if (s === undefined) return
      if (levels === 0) return s
      if (levels === 1) return s.split(',')
      if (levels === 2) return s.split(',').map(ss => ss.split('|'))
    }
    /*
     * Parses structured data encoded in INFO column attributes.
     * Args:
     *    obj - a (simple) parsed INFO column value, ie, an object with attributes
     *          and simple string values
     *    info - list of descriptors of what obj attributes to parse. Each descriptor
     *           is a list of 3 values: name of obj attribute to parse, the nesting level of
     *           data in the string, and the name to use in the output objects.
     * Returns:
     *    A list of objects
     */
    const splitCombine = function (obj, info) {
        const cols = info.map(v => splitString(obj[v[0]], v[1]))
        const names = info.map(v => v[2])
        const res = u.cols2rows(cols, names)
        return res
    }

    return this.greg.getReader(g, 'variants').then(reader => {
      if (!reader) return []
      return reader.readRange(c, s, e).then(vars => {
          return vars.map(v => {
            const attrs = v[7]
            //
            if (attrs['geneLevelConsequence']) {
                attrs['genes'] = splitCombine(attrs, [
                    ['allele_of_gene_ids', 1, 'curie'],
                    ['allele_of_gene_symbols', 1, 'symbol'],
                    ['geneLevelConsequence', 2, 'consequence'],
                    ['geneImpact', 1, 'impact']
                 ])
            } else {
                attrs['genes'] = []
            }
            //
            if (attrs['allele_ids']) {
                attrs['alleles'] = splitCombine(attrs, [
                    ['allele_ids', 1, 'curie' ],
                    ['allele_symbols', 1, 'symbol'],
                    ['allele_symbols_text', 1, 'symbolText']
                ])
            } else {
                attrs['alleles'] = []
            }
            //
            if (attrs['allele_of_transcript_ids']) {
                attrs['transcripts'] = splitCombine(attrs, [
                    ['allele_of_transcript_ids', 1, 'curie'],
                    ['allele_of_transcript_gff3_ids', 1, 'gff3id'],
                    ['allele_of_transcript_gff3_names', 1, 'gff3name'],
                    ['transcriptLevelConsequence', 2, 'consequence'],
                    ['transcriptImpact', 1, 'impact'],
                ]).sort((a,b) => {
                  if (a.curie < b.curie) return -1
                  else if (a.curie > b.curie) return 1
                  else return 0
                })
            } else {
                attrs['transcreipts'] = []
            }
            return {
              ID: attrs['hgvs_nomenclature'],
              genome: g,
              chr: c,
              symbol: attrs['alleles'].map(a => a.symbolText).join(","),
              start: v[1],
              end: v[1] + v[3].length - 1,
              ref: v[3],
              alt: v[4],
              so_term: attrs['soTerm'],
              gEffects: attrs['genes'],
              aEffects: attrs['alleles'],
              tEffects: attrs['transcripts'],
              layout: {
                  lane: 0,
                  y: 0,
                  height: 0
              }
            }
          })
      })
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
          const cds = this._unpackCds(t[8]['cds'], tlen, exons, t.strand)
          const attrs = t[8]
          const tt= {
            gID: attrs['Parent'],
            ID: attrs['ID'],
            label: this.stripPrefix(attrs['Name'] || attrs['transcript_id'] || attrs['ID']),
            transcript_id: attrs['transcript_id'],
            exons: exons,
            start: Math.min.apply(null,exons.map(e => e.start)),
            end: Math.max.apply(null,exons.map(e => e.end)),
            strand: t[6],
            length: tlen,
            cds: cds
          }
          return tt
        }).sort((a,b) => {
          return a.label < b.label ? -1 : a.label > b.label ? 1 : 0
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
  _unpackCds (cdsAttr, tlen, exons, strand) {
    if (!cdsAttr) return null
    const parts = cdsAttr.split('|')
    const c = {
      ID: parts[0],
      protein_id: parts[1],
      label: this.stripPrefix(parts[1] || parts[0]),
      start: parseInt(parts[2]),
      end: parseInt(parts[3])
    }
    // compute the length of the CDS by adding up the included exons (taking care not to
    // include UTRs)
    const PUTR = strand === "+" ? '5_prime_utr' : '3_prime_utr'
    const DUTR = strand === "+" ? '3_prime_utr' : '5_prime_utr'
    const CDS = 'cds'
    c.pieces = exons.reduce((a,r) => {
      // make a copy so we don't munge the exon object
      const x = { start: r.start, end: r.end }
      if (x.end < c.start) {
          a.push({ start: x.start, end: x.end, type: PUTR })
      }
      else if (x.start > c.end) {
          a.push({ start: x.start, end: x.end, type: DUTR })
      } else {
          const pUTR = { start: x.start, end: Math.min(c.start - 1, x.end), type: PUTR }
          if (pUTR.start <= pUTR.end) a.push(pUTR)
          const cds = { start: Math.max(c.start, x.start), end: Math.min(c.end, x.end), type: CDS }
          a.push(cds)
          const dUTR = { start: Math.max(c.end + 1, x.start), end: x.end, type: DUTR }
          if (dUTR.start <= dUTR.end) a.push(dUTR)
      }
      return a
    }, [])
    c.length = c.pieces.reduce((a,x) => a + (x.type==='cds' ? x.end - x.start + 1 : 0), 0)
    return c
  }
  // Given transcripts for a gene, returns an object containing (1) the "distinct" exons, and 
  // (2) the "composite" exons
  _computedExons (tps) {
    const cExons = [] // composite exons
    const dExons = new Set() // distinct exons
    const allExons = tps.reduce((a,t) => a.concat(t.exons), [])
    allExons.sort((e1, e2) => e1.start - e2.start)
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
  // 
  getSequences (descrs, filename) {
    const fparam = filename ? `&filename=${filename}` : ''
    const params = `descriptors=${JSON.stringify(descrs)}${fparam}`
    return u.fetch(this.fetchUrl, 'text', params)
  }
  getAlignments (descrs) {
    const params = `descriptors=${JSON.stringify(descrs)}&return=alignments`
    return u.fetch(this.fetchUrl, 'json', params)
  }
  getExonAlignmentScores (descrs) {
    const params = `descriptors=${JSON.stringify(descrs)}&return=exonscores`
    return u.fetch(this.fetchUrl, 'json', params)
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
    const id = target.label || target.ID
    const len = target.length
    const sym = f.symbol || ''
    const gn = f.genome.name
    const parts = target.pieces ? (target.pieces.filter(p => p.type==='cds')) : (target.exons || [f])
    const starts = parts.map(p => p.start)
    const lengths = parts.map(p => p.end - p.start + 1)
    const d = {
      header: `${gn}::${id} ${sym} (${stype})`,
      ID: id,
      // seqId: stype === 'transcript' ? t.transcript_id : stype === 'cds' ? t.cds.protein_id : null,
      genome: f.genome.name,
      genomeUrl: f.genome.url,
      type: stype,
      chromosome: f.chr.name,
      start: starts,
      length: lengths,
      totalLength: len,
      selected: true,
      reverseComplement: f.strand === '-',
      translate: stype === 'cds'
    }
    return d
  }
  // Returns canonical ids of all homologs of f
  getHomologCids (f, genomes) {
    if (!f.cID) return [f.ID]
    genomes = genomes || this.app.vGenomes
    const taxons = Array.from(new Set(genomes.map(g => this.fixTaxonId(g.metadata.taxonid))))
    const hm = this.homologyManager
    const txA = this.getTaxonId(f)
    if (this.app.includeParalogs) {
      return hm.getHomologIdsExt(f.cID, txA, taxons)
    } else {
      const homs = hm.getOrthologIds(f.cID, txA, taxons)
      homs.push(f.cID)
      return homs
    }
  }
  // Returns homologs of a feature from the given genome(s).
  // Args:
  //    f : a Feature
  //    genomes : genomes to get homologs for. If not specified,
  //            gets homologs for all currently selected genomes.
  // Returns:
  //    List of features from the specified genome(s) that are homologous to f
  //
  getHomologs (f, genomes) {
    genomes = this.fixGenomesArg(genomes)
    if (typeof(f) === 'string') {
      // FIXME picking an arbitrary one. Should use them all.
      f = (this.getFeaturesBy(f) || [])[0]
      if (!f) return []
    }
    const homIds = this.getHomologCids(f, genomes)
    const homs = homIds.map(hid =>
       this.getFeaturesByCid(hid).filter(hom =>
           genomes.indexOf(hom.genome) >= 0))
    const fhoms = u.flatten(homs)
    if (fhoms.length === 0 && f.genome in genomes) return [f]
    return fhoms
  }
  //
  equivalent (fA, fB) {
    // same feature?
    if (fA === fB || fA.ID === fB.ID) return true
    // else if no cID, can't be homologs
    if (!fA.cID) return false
    // same cID?
    if (fA.cID === fB.cID) return true
    // fB is a homolog?
    const txA = this.getTaxonId(fA)
    const txB = this.getTaxonId(fB)
    if (txA === txB && !this.app.includeParalogs) return false
    const idBs = this.homologyManager.getHomologIds(fA.cID, txA, [txB])
    if (idBs.indexOf(fB.cID) >= 0) return true
    //
    return false
  }
  //
  fixGenomesArg (genomes) {
    if (!genomes) {
      return this.app.vGenomes
    } else if (!Array.isArray(genomes)) {
      return [genomes]
    } else {
      return genomes
    }
  }
  // Hacky function so that all mouse species are considered the same
  fixTaxonId (taxonid) {
    if (taxonid.startsWith("100")) taxonid = "10090"
    return taxonid
  }
  //
  getTaxonId (f) {
    const t = f.genome.metadata.taxonid
    return this.fixTaxonId(t)
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
  //   r - a parsed GFF3(-like) record
  register (r) {
    const f = gff3.record2object(r)
    f.transcripts = []
    f.composite = {}
    f.sotype = f.type
    f.genome = this.genome
    f.chr = this.chr
    //
    f.length = f.end - f.start + 1
    if (f.length > config.DataManager.featureSizeLimit) {
      // console.log('Feature too big. Skipping: ', f)
      return null
    }
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
    f.symbol = f.symbol || f.Name || f.gene_id
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
    //
    f.layout = {
        lane: 0,
        y: 0,
        height : 0
    }
    // For performance. Don't want to observe 10,000s of objects.
    // Vue is not reactive to frozen objects.
    Object.freeze(f)
    //
    return f
  }
}

export default DataManager
