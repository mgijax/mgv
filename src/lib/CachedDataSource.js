import KeyStore from '@/lib/KeyStore'
import config from '@/config'
class CachedDataSource {
  constructor (dataSource) {
    this.ds = dataSource
    this.ks = new KeyStore(config.CachedDataSource.dbName)
  }
  _call (dsmethod, key, ...args) {
    return this.ks.get(key).then(kobjects => {
      if (kobjects !== undefined) {
        // console.log('CachedDataSource: found in KeyStore:', key)
        return kobjects
      } else {
        // console.log('CachedDataSource: not found in KeyStore: ', key, '. Requesting...')
        return this.ds[dsmethod](...args).then(dsobjs => {
          // console.log('CachedDataSource: setting KeyStore:', key)
          this.ks.set(key, dsobjs)
          return dsobjs
        })
      }
    })
  }
  getGenomes () {
    return this._call('getGenomes', 'genomes')
  }
  getChromosomes (g) {
    return this._call('getChromosomes', g.name + '.chromosomes', g)
  }
  getFeatures (g, c) {
    return this._call('getFeatures', `${g.name}.${c.name}.features`, g, c)
  }
  getModels (g, c, s, e) {
    return this._call('getModels', `${g.name}.${c.name}.models.${s}.${e}`, g, c, s, e)
  }
  getSequence (g, c, s, e) {
    return this.ds.getSequence(g, c, s, e)
  }
  getQueries () {
    return this.ds.getQueries()
  }
  getFastaUrl (f, type, genomes) {
    return this.ds.getFastaUrl(f, type, genomes)
  }
}
export default CachedDataSource
