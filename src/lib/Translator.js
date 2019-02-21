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
    if (this.n2block[aGenome.name] && this.n2block[aGenome.name][bGenome.name]) {
      return Promise.resolve(this.n2block[aGenome.name][bGenome.name])
    }
    return this.app.dataManager.getAllFeatures(aGenome).then(afeats => {
      return this.app.dataManager.getAllFeatures(bGenome).then(bfeats => {
        let blocks = generateSyntenyBlocks(aGenome.name, afeats, bGenome.name, bfeats)
        let n2bks = this.n2block
        let a2b = n2bks[aGenome.name] = n2bks[aGenome.name] || {}
        let b2a = n2bks[bGenome.name] = n2bks[bGenome.name] || {}
        a2b[bGenome.name] = blocks[0]
        b2a[aGenome.name] = blocks[1]
        return blocks[0]
      })
    })
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
