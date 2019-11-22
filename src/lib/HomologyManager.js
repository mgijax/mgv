import u from '@/lib/utils'
import config from '@/config'
//
class HomologyManager {
  //
  constructor (dataManager, url) {
    this.dataManager = dataManager
    this.app = this.dataManager.app
    //  Organize pairwise assertions into multilevel mapping:
    //          taxonA -> taxonB -> idA -> [idB]
    this.index = {}
    this.readyP = u.fetch(url+ '/homologies.json', 'json').then(data => {
      // Each row of data is a list of five values:
      //    [idA, taxonA, idB, taxonB, YNcode]
      // Example:
      //    ["FB:FBgn0000028","7227","ZFIN:ZDB-GENE-000523-2","7955","NY"]
      data.forEach(r => {
        // extract the row into vars
        const idA = r[0]
        const txA = r[1]
        const idB = r[2]
        const txB = r[3]
        const yn  = r[4]
        // add to index
        // get (and init, if necessary) top level index, by taxon A
        const i0 = this.index[txA] = (this.index[txA] || {})
        // get (and init, if necessary) second level index, by taxon B
        const i1 = i0[txB] = (i0[txB] || {})
        // get (and init, if necessary) list of homologs for idA in taxon B
        const ar = i1[idA] = (i1[idA] || [])
        // add idB
        ar.push(idB)
      })
      return true
    })
  }
  //
  ready () {
    return this.readyP
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
  getOrthologIds (idA, txA, txB) {
    const abIndex = (this.index[txA] || {})[txB] || {}
    return abIndex[idA] || []
  }
  //
  isOrthologId (idA, txA, idB, txB) {
    const orths = this.getOrthologIds(idA, txA, txB)
    return orths.indexOf(idB) >= 0
  }
  // For a given (canonical) id in a given taxon, returns
  // list of all homologous (canonical) ids from specified taxons.
  // For different taxonids, uses orthology assertions. 
  // For same taxon id, uses inferred paralogy (if includeParalogs is on)
  // or just idA (otherwise)..
  getHomologIds (idA, txA, txBs) {
    txA = this.fixTaxonId(txA)
    const txAi = this.index[txA] || {}
    const homIds =  u.flatten(txBs.map(txB => {
      txB = this.fixTaxonId(txB)
      if (txB === txA) {
        // same taxon.
        if (this.app.includeParalogs) {
          // inlude all inferred paralogs
          return this.getInferredParalogIds(idA, txA, txBs)
        } else {
          // inlude just idA
          return [idA]
        }
      } else {
        // different taxon. Use orthology mappings.
        const txABi = txAi[txB] || {}
        return txABi[idA] || []
      }
    }))
    // eliminate dups
    return Array.from(new Set(homIds))
  }
  // Define inferred paralogs as orthologs of my orthologs that are in my taxon.
  //
  getInferredParalogIds (idA, txA, txBs) {
    txA = this.fixTaxonId(txA)
    txBs = txBs.map(tx => this.fixTaxonId(tx))
    const paraIds = u.flatten(txBs.map(txB => {
      const bHomIds = txA === txB ? [] : this.getHomologIds(idA, txA, [txB])
      const bHomParas = u.flatten(bHomIds.map(idB => this.getHomologIds(idB, txB, [txA])))
      return bHomParas
    }))
    // make sure paras includes itself
    paraIds.push(idA)
    // eliminate dupes
    return Array.from(new Set(paraIds))
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
    const txA = this.fixTaxonId(f.genome.metadata.taxonid)
    const txBs = Array.from(new Set(genomes.map(g => this.fixTaxonId(g.metadata.taxonid))))
    const homIds = this.getHomologIds(f.cID, txA, txBs)
    const homs = homIds.map(hid =>
       this.dataManager.getFeaturesByCid(hid).filter(hom =>
           genomes.indexOf(hom.genome) >= 0))
    return u.flatten(homs)
  }
  //
  isOrtholog (fA, fB) {
    return this.isOrthologId(fA.cID, this.getTaxonId(fA), fB.cID, this.getTaxonId(fB))
  }
  //
  isHomolog (fA, fB) {
    // same feature?
    if (fA === fB || fA.ID === fB.ID) return true
    // else if no cID, can't be homologs
    if (!fA.cID) return false
    // cIDs match?
    if (fA.cID === fB.cID) return true
    // fB is a homolog?
    const txA = this.getTaxonId(fA)
    const txB = this.getTaxonId(fB)
    const aHomIds =  this.getHomologIds(fA.cID, txA, this.app.vTaxons)
    if (aHomIds.indexOf(fB.cID) >= 0) return true
    return false
  }
  // Returns paralogs of f inferred through common orthology in a specified genome(s)
  // Args:
  //    f : a Feature
  //    genomes : genome(s) to compare with. If not specified, uses all current selected genomes.
  // Returns:
  //    List of features in f's genome that share a common orthology to
  //    something(s) in the specified genome(s). 
  getInferredParalogs (f, genomes) {
    genomes = this.fixGenomesArg(genomes)
    const homs = this.getHomologs(f, genomes)
    const paras = u.flatten(homs.map(hom => this.getHomologs(hom, f.genome)))
    return paras
  }
  // Returns True iff f1 and f2 are inferred paralogs with respect to the given genome.
  // f1 and f2 are inferred paralogs iff the have at least one ortholog in common in the 
  // specified genome. 
  isInferredParalog (f1, f2, genomes) {
    return this.getInferredParalogs(f1, genomes).indexOf(f2) >= 0
  }
}
export default HomologyManager
