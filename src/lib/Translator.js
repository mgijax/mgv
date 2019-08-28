//
import { generateSyntenyBlocks } from '@/lib/SyntenyBlocks'
//
class Translator {
  constructor (app) {
    this.app = app
    // this.sbStore = new KeyStore(config.SyntenyBlockManager.dbName)
    // Index block covers by genome name
    //     genome A name -> genome B name -> aCover
    //     genome B name -> genome A name -> bCover
    this.n2block = {}
  }
  // Returns a translator (which is just one side of a joined BlockCover - see SyntenyBlocks.js)
  // for mapping coordinates in aGenome to coordinates in bGenome.
  // Since creating a translator is expensive, the results are cached. 
  // Creating a translator from A to B simultaneously creates a translator from B to A (which is also cached).
  getTranslator (aGenome, bGenome) {
    const n2bks = this.n2block
    const aName = aGenome.name
    const bName = bGenome.name
    if (n2bks[aName] && n2bks[aName][bName]) {
      return n2bks[aName][bName]
    }
    console.log("Translator: generating synteny blocks for ", aName, bName)
    const p = this.app.dataManager.getAllFeatures(aGenome).then(afeats => {
      return this.app.dataManager.getAllFeatures(bGenome).then(bfeats => {
        return generateSyntenyBlocks(aName, afeats, bName, bfeats)
      })
    })
    const a2b = n2bks[aName] = n2bks[aName] || {}
    const b2a = n2bks[bName] = n2bks[bName] || {}
    a2b[bName] = p.then(blocks => blocks[0])
    b2a[aName] = p.then(blocks => blocks[1])
    return a2b[bName]
  }
  // Translates a coordinate range from aGenome to the 'equivalent' coordinate range(s) in bGenome.
  // Returns a list of coordinate ranges in bGenome.
  translate (aGenome, chr, start, end, bGenome) {
    return this.getTranslator(aGenome, bGenome).then(t => {
      return t.translate(chr, start, end)
    })
  }
  //
  getBlocksInRange(aGenome, chr, start, end, bGenome) {
    return this.getTranslator(aGenome, bGenome).then(t => {
      return t.getBlocksInRange(chr, start, end)
    })
  }
}
export default Translator
