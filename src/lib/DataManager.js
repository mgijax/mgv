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
import { GenomePainter } from '@/lib/GenomePainter'
import u from '@/lib/utils'
import config from '@/config'
import { GenomeRegistrar } from '@/lib/GenomeRegistrar'
import { FastaReader } from '@/lib/FastaReader'
import HomologyManager from '@/lib/HomologyManager'
import gff3 from '@/lib/gff3lite'

class DataManager {
  constructor (app) {
    this.app = app
    this.url = this.app.runtimeConfig.dataUrl
    this.fetchUrl = this.url + "/fetch.cgi"
    this.cache = {} // { genome.name -> { chr.name -> [features] } }
    this.pending = {} // genome.name -> pending promise
    this.id2feat = {} // genome -> ID -> feature
    this.cid2feats = {} // curie -> [ features ]
    this.symbol2feats = {} // symbol -> [ features ]
    this.greg = new GenomeRegistrar(this.fetchUrl)
    this.genomes = this.greg.register()
    this.homologyManager = new HomologyManager(this, this.fetchUrl)
    this.genomePainter = new GenomePainter()
  }
  getGenomeByName (n) {
    return this.greg.lookupGenome(n)
  }
  getFeatureById (g, id) {
    const gids = this.id2feat[g.name]
    return gids ? gids[id] : undefined
  }
  getFeaturesByCid (cid) {
    return this.cid2feats[cid] || []
  }
  getFeaturesBySymbol (symbol) {
    return this.symbol2feats[symbol.toLowerCase()] || []
  }
  getFeaturesBy (val) {
    //
    let fs = Object.entries(this.id2feat).reduce((v,e) => v.concat(e[1][val]), []).filter(x=>x)
    if (fs.length > 0) return fs
    //
    fs = this.getFeaturesByCid(val)
    if (fs.length > 0) return fs
    //
    fs = this.getFeaturesBySymbol(val)
    if (fs.length > 0) return fs
    //
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
    if (Array.isArray(g)) {
        return Promise.all(g.map(gg => this.ensureFeatures(gg)))
    }
    //
    if (this.pending[g.name]) return this.pending[g.name]
    if (this.cache[g.name]) return Promise.resolve(true)
    //
    const txid = this.fixTaxonId(g.taxonid)
    const hp = this.homologyManager.loadHomologiesForTaxon(txid)
    //
    this.cache[g.name] = {}
    this.pending[g.name] = this.greg.getReader(g, 'models.genes').then(reader => {
      this.app.$root.$emit('message', { message: 'Loading ' + g.name + '...' })
      return reader.readAll().then(recs => {
        let prevChr = null
        let feats = []
        let allFeats = []
        // First make sure features are sorted properly (used to assume this)
        recs = recs.filter(r => Array.isArray(r))
        recs.sort(u.byChrStart).forEach(r => {
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
        g.stats.totalFeats = allFeats.reduce((v,a) => v + a.length, 0)
        g.stats.totalGenomeLength = g.chromosomes.reduce((v,c) => v + c.length, 0)
        g.stats.featureDensity = (g.stats.totalFeats / g.stats.totalGenomeLength) * 1000000
        g.stats.objectsInMemory = g.stats.totalFeats
        this.app.objectsInMemory += g.stats.objectsInMemory
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
            return includeTranscripts ? this.ensureModels(g, c, s, e, feats).then(() => feats) : feats
       })
    }
    // Returns a promise the resolves when all the genes that overlap the specified region
    // have their transcripts attached
    ensureModels (g, c, s, e, feats) {
        u.debug("Ensure models: nominal range:", g.name, c.name, s, e)
        const gaps = this.genomePainter.query(g, c, s, e)
        const ps = gaps.map(r => this.fillGap(g, c, r.start, r.end, feats.filter(f => gc.overlaps(f, r))))
        return Promise.all(ps).then(p => {
            this.genomePainter.paint(g, c, s, e)
            const prs = this.genomePainter.getPaintedRegions(g,c)
            const prss = prs.map(pr => `(${pr.start} ${pr.end})`).join(' ')
            u.debug(`After: painted regions ${g.name}::${c.name}: ${prss}`)
            return p
        })
    }
    //
    fillGap (g, c, s, e, feats) {
        if (feats.length === 0) {
            return Promise.resolve(true)
        }
        u.debug("Ensure models: gap fill range:", g.name, c.name, s, e)
        // Expand the range to include the outer limits of overlapped genes
        const s_exp = Math.min.apply(null, feats.map(f => f.start).concat([s]))
        const e_exp = Math.max.apply(null, feats.map(f => f.end).concat([e]))
        // Get models in the expanded region. Note that this will also return (potentially) partial models
        // that overlap the ends of the extended range, but do not overlap the nominal range.
        // So we create an index of the genes in the nominal region, and only process transcripts for those.
        const findex = feats.reduce((x,f) => { x[ f.ID ] = f; return x }, {})
        const mp = this.fetchModels(g, c, s_exp, e_exp).then(mods => {
          let ngenes = 0
          let nadded = 0
          mods.forEach(m => {
              // unpack
              const id = m[0]
              const trs = m[1]
              // Lookup the gene. Only consider genes that overlap the nominal range.
              const f = findex[id]
              if (!f) return
              // If there are any transcripts for this gene, then we have all transcripts for the gene.
              // Can skip th rest.
              if (f.transcripts.length) return
              //
              //u.debug("Filling in transcripts for:", f.symbol)
              // Ok, transfer the transcripts to the gene. Remember f is a frozen object, so we can't
              // just assign f.transcripts = trs.  We have push transcripts into the existing array.
              if (trs.length) ngenes += 1
              trs.forEach(t => {
                  t.gene = f
                  f.transcripts.push(t)
              })
              nadded += f.transcripts.length
              // Now merge exons to create a composite transcript.
              const c = this._computedExons(f.transcripts)
              const cT = c.composite.length ? {
                  gID: f.ID,
                  ID: f.ID + "_composite",
                  gene: f,
                  exons: c.composite,
                  dExons: c.distinct,
                  start: c.composite[0].start,
                  end: c.composite[c.composite.length - 1].end,
                  length: c.composite.reduce((l,x) => l + x.end - x.start + 1, 0),
                  cds: null
              } : {
                  gID: f.ID,
                  ID: f.ID + "_composite",
                  gene: f,
                  exons: [{start: f.start, end: f.end}],
                  dExons: [{start: f.start, end: f.end}],
                  start: f.start,
                  end: f.end,
                  length: f.end - f.start + 1,
                  cds: null
              }
              // Transfer the composite. Similar to transcripts, we have to copy in the contents rather than assign to f.composite
              Object.assign(f.composite, cT)

          })
          u.debug(`${g.name}:${c.name}:: ${nadded} transcripts added to ${ngenes} genes`)
          g.stats.objectsInMemory += nadded
          this.app.objectsInMemory += nadded // app object maintains a grand total
        })
        return mp
    }

  // Returns a promise for the transcripts of features that overlap the
  // specified range of the specified genome. Each transcript includes
  // its exons. Coding transcripts also contain the coordinates of the
  // start and stop codons.
  fetchModels (g, c, s, e) {
    u.debug("Fetching models:", g.name, c.name, s, e)
    return this.greg.getReader(g, 'models').then(reader => {
      return reader.readRange(c, s, e).then(models => {
          const models2 = models.reduce((ms, m) => {
              if (!m.children) return ms
              const nts = m.children.map(t => {
                  const exons = this._condenseExons(t)
                  const tlen = t[4] - t[3] + 1
                  const cds = this._condenseCds(t, exons)
                  const attrs = t[8]
                  const tt= {
                    gID: attrs['Parent'],
                    ID: attrs['ID'],
                    label: this.stripPrefix(attrs['Name'] || attrs['transcript_id'] || attrs['ID']),
                    transcript_id: attrs['transcript_id'],
                    exons: exons,
                    start: t[3],
                    end: t[4],
                    strand: t[6],
                    length: tlen,
                    cds: cds
                  }
                  // backrefs from exons to the transcript
                  tt.exons.forEach(e => e.transcript = tt)
                  return tt
              })
              nts.sort((a,b) => {
                  return a.label < b.label ? -1 : a.label > b.label ? 1 : 0
              })
              ms.push([m[8]['ID'], nts])
              return ms
          }, [])
          return models2
      })
    })
  }
  _condenseExons (t) {
    const exons = (t.children || []).filter(f => f[2] === "exon").sort(u.byChrStart)
    return exons.map((e,i) => { return { start: e[3], end: e[4], eIndex:i } })
  }

  _condenseCds (t, exons) {
    const cdss = (t.children || []).filter(f => f[2] === "CDS").sort(u.byChrStart)
    if (cdss.length === 0) return null
    const attrs = cdss[0][8]
    const ID = attrs['ID']
    const protein_id = attrs['protein_id']
    const label = this.stripPrefix(protein_id || ID)
    const start = parseInt(cdss[0][3])
    const end = parseInt(cdss[cdss.length-1][4])
    const length = cdss.reduce((tot, c) => tot + c[4] - c[3] + 1, 0)
    const c = { ID, protein_id, label, start, end, length }
    //
    const strand = t[6]
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
    return c
  }
  // When an exon is shared by multiple transcripts, each transcript has its own copy.
  // One thing this routine does is create a list of "distinct" exons.
  // Additionally, different distinct exons may overlap. The other thing this routine does
  // is compute the list of "composite" exons. By definition, no two composited exons overlap.
  // Finally, exons, distinct exons, and composite exons are tied together so it's easy to
  // traverse between them (e.g., what composite exon does a transcript exon map to? or, what
  // distinct exons map to a given composite?)
  _computedExons (tps) {
    const cExons = [] // composite exons
    const dExons = {} // distinct exons
    const allExons = tps.reduce((a,t) => a.concat(t.exons), [])
    allExons.sort((e1, e2) => e1.start - e2.start)
    allExons.forEach(e => {
      // distinct
      const key = `${e.start}_${e.end}`
      if (!dExons[key]) {
          dExons[key] = {
              start: e.start,
              end: e.end,
              length: e.end - e.start + 1,
              tExons: []
          }
      }
      e.de = dExons[key]
      e.de.tExons.push(e)
    })
    // Turn map into sorted list
    const dExonsList = Object.values(dExons).sort((a,b) => a.start - b.start)
    // From overlapping distinct exons, compute composite exons
    dExonsList.forEach((de, i) => {
      de.dIndex = i
      //
      const lastE = cExons[cExons.length - 1]
      if (!lastE || lastE.end < de.start) {
        cExons.push({
            cIndex:cExons.length,
            start: de.start,
            end: de.end,
            length: de.end - de.start + 1,
            dExons: []
        })
      } else {
        lastE.end = Math.max(lastE.end, de.end)
      }
      const cE = cExons[cExons.length - 1]
      cE.dExons.push(de)
      de.composite = cE
    })
    return {
      distinct: dExonsList,
      composite: cExons
    }
  }
  // Returns a promise for an arbitrary set of sequences.
  getSequences (descrs, filename) {
    const reader = new FastaReader({fetch: u.fetch}, 'assembly', null, this.fetchUrl)
    return reader.read(descrs, filename)
  }
  //
  // Returns a promise for the genomic sequence of the specified range for the specified genome
  getSequence (g, c, s, e, doRC) {
    return this.greg.getReader(g, 'assembly').then(reader => {
        return reader.readRange(c, s, e, doRC)
    })
  }
  //
  // A sequence descriptor specifies arbitrary slice(s) of a chromosome,
  // and whether to reverse complement and/or translate the sequence.
  // The descriptor is an object with these fields:
  // - header (string) The header line for the sequence. Optional. If none provided, a default will be created.
  // - genome (string) Path name of the genome, e.g., mus_musculus_aj
  // - regions (string) Argument to pass to faidx, space separated list of chr:start-end.
  // - type (string) one of: 'dna', 'composite transcript', 'transcript', 'cds'
  // - reverse (boolean) True iff the sequence should be reverse complemented
  // - translate (boolean) True iff the sequence should be translated to protein
  // - selected (boolean) True iff the sequence is in the selected state
  //
  makeSequenceDescriptor (stype, f, t) {
    const target = stype === 'dna' ? f : stype === 'composite transcript' ? t : stype === 'transcript' ? t : t.cds
    const len = target.length
    const parts = target.pieces ? (target.pieces.filter(p => p.type==='cds')) : (target.exons || [f])
    const regions = parts.map(p => `${f.chr.name}:${p.start}-${p.end}`).join(" ")
    const label = target === f ? f.label : `${t.ID} (${f.label})`
    const d = {
      ID: label,
      genome: f.genome.path,
      track: "assembly",
      regions: regions,
      type: stype,
      totalLength: len,
      selected: true,
      reverse: f.strand === '-',
      translate: stype === 'cds'
    }
    return d
  }
  //
  makeSequenceDescriptorForRegion (r, hdr) {
      const desc = {
            genome: r.genome.path,
            track: "assembly",
            regions: `${r.chr.name}:${r.start}-${r.end}`,
            type: 'dna',
            reverse: r.reversed,
            translate: false,
            selected: true,
            totalLength: r.end - r.start + 1
          }
      if (hdr) desc.header = hdr
      return desc
  }
  // Returns canonical ids of all homologs of f
  getHomologCids (f, genomes) {
    if (!f.curie) return [f.ID]
    genomes = genomes || this.app.vGenomes
    const taxons = Array.from(new Set(genomes.map(g => this.fixTaxonId(g.taxonid))))
    const hm = this.homologyManager
    const txA = this.getTaxonId(f)
    if (this.app.includeParalogs) {
      return hm.getHomologIdsExt(f.curie, txA, taxons)
    } else {
      const homs = hm.getOrthologIds(f.curie, txA, taxons)
      homs.push(f.curie)
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
    if (fhoms.length === 0 && genomes.indexOf(f.genome) >= 0) return [f]
    return fhoms
  }
  // Utility function for stripping the prefix from a curie style identifier
  stripPrefix (s) {
        return s.substr(s.indexOf(':')+1)
  }
  //
  equivalent (fA, fB) {
    // same feature?
    if (fA === fB || (fA.genome === fB.genome && fA.ID === fB.ID)) return true
    // else if no curie, can't be homologs
    if (!fA.curie) return false
    // same curie?
    if (fA.curie === fB.curie) return true
    // fB is a homolog?
    const txA = this.getTaxonId(fA)
    const txB = this.getTaxonId(fB)
    if (txA === txB && !this.app.includeParalogs) return false
    const idBs = this.homologyManager.getHomologIds(fA.curie, txA, [txB])
    if (idBs.indexOf(fB.curie) >= 0) return true
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
    const t = f.genome.taxonid
    return this.fixTaxonId(t)
  }
    // Opposite of ensureModels. Deletes the transcripts/exons/CDSs for the genes in the specified region.
    // Only gene completely contained in the region are affected.
    unloadModels (g, c, s, e) {
        if (!g) {
            this.app.allGenomes.forEach(g => this.unloadModels(g))
            return
        }
        if (!c) {
            g.chromosomes.forEach(c2 => this.unloadModels(g, c2, 1, c2.length))
            return
        }
        if (!s) s = 1
        if (!e) e = c.length

        if (!g.stats.objectsInMemory) {
            // genome hasn't been loaded, so skip the rest
            return
        }

        const genes = this.cache[g.name][c.name] || []
        let nfreed = 0
        let ngenes = 0
        genes.forEach(f => {
            // only clear models of genes completely contained with the region
            if (f.start >= s && f.end <= e && f.transcripts.length) {
                ngenes += 1
                nfreed += f.transcripts.length
                f.transcripts.splice(0, f.transcripts.length)
                Object.entries(f.composite).forEach(e => delete f.composite[e[0]])
            }
        })
        this.genomePainter.erase(g, c, s, e)
        if (ngenes) u.debug(`${g.name}:${c.name}:: ${nfreed} transcripts freed from ${ngenes} genes.`)
        g.stats.objectsInMemory -= nfreed
        this.app.objectsInMemory -= nfreed // app object maintains a grand total
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
            this.unloadModels(g)
            delete this.pending[gn]
            delete this.cache[gn]
            delete this.id2feat[gn]
            for (let cn in gcache) {
                const cfeats = gcache[cn]
                this.app.objectsInMemory -= cfeats.length
                cfeats.forEach(f => {
                    const cidFeats = this.cid2feats[f.curie]
                    if (cidFeats) {
                        this.cid2feats[f.curie] = cidFeats.filter(ff => ff !== f)
                        if (this.cid2feats[f.curie].length === 0) {
                            delete this.cid2feats[f.curie]
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
}
// Registers features for one chromsome of a genome
class FeatureRegistrar {
  constructor (g, c, id2f, cid2f, sym2f) {
    // each chromosome of each genome has its own registrar
    this.genome = g
    this.chr = c
    c.minStart = c.length
    c.maxEnd = 0
    // map feature.ID => feature
    this.id2feat = id2f
    // map feature.curie => [ features ]
    this.cid2feats = cid2f
    // map feature.symbol => [ features ]
    this.symbol2feats = sym2f
  }
  // Args:
  //   r - a parsed GFF3(-like) record
  register (r) {
    const f = gff3.record2object(r)
    // copy attributes to top level obj for easy asscess
    f.ID = f.attributes.ID
    f.curie = f.attributes.curie
    f.symbol = f.attributes.symbol || f.attributes.Name

    // Some short string usable in any printing context. Should always be defined.
    f.label = f.symbol || f.curie || f.ID || ""

    // Attach genome and chromosome objects
    f.genome = this.genome
    f.chr = this.chr

    // Compute and store length. Do length check.
    f.length = f.end - f.start + 1
    if (f.length > config.DataManager.featureSizeLimit) {
      // FIXME: is this check really necessary?
      u.debug('Feature too big. Skipping: ', f)
      return null
    }

    // to be filled in
    f.transcripts = []
    f.composite = {}
    //
    f.layout = {
        lane: 0,
        y: 0,
        height : 0
    }

    // Update observed limits for my chromosome
    this.chr.minStart = Math.min(this.chr.minStart, f.start)
    this.chr.maxEnd = Math.max(this.chr.maxEnd, f.end)

    // Index feature by ID. ID should be unique within a genome.
    if (!this.id2feat[f.genome.name]) this.id2feat[f.genome.name] = {}
    if (f.ID) {
        if (this.id2feat[f.genome.name][f.ID]) throw `Non unique feature ID detected. ${f.ID}`
        this.id2feat[f.genome.name][f.ID] = f
    }

    // Index by curie ID if there is one. Curies should be unique within one genome, but may be shared across genomes
    // within the same species.
    if (f.curie) {
      let d = this.cid2feats[f.curie]
      if (!d) d = this.cid2feats[f.curie] = []
      d.push(f)
    } else {
      f.curie = null // make sure it's not undefined
    }
    // Index by symbol, if there is one. Symbols should be unique within a genome.
    if (f.symbol) {
      let lc = f.symbol.toLowerCase()
      let d = this.symbol2feats[lc]
      if (!d) d = this.symbol2feats[lc] = []
      d.push(f)
    }

    // For performance. Don't want to observe 10,000s of objects.
    // Vue is not reactive to frozen objects.
    // Also note that freezing f does _not_ freeze objects that f points to,
    // in particular, f.layout, f.transcripts, f.composite. The contants of
    // these can and do change. Like f, though, they are non-reactive.
    Object.freeze(f)

    //
    return f
  }
}

export default DataManager
