import { Store, set, get, del, clear, keys } from 'idb-keyval'

class KeyStore {
  constructor (name, osname) {
    try {
      this.store = new Store(name, osname || name)
      this.disabled = false
      // console.log(`KeyStore: ${name}`)
    } catch (err) {
      this.store = null
      this.disabled = true
      this.nullP = Promise.resolve(null)
      throw `KeyStore: error in constructor: ${err}.`
    }
  }
  get (key) {
    if (this.disabled) return this.nullP
    return get(key, this.store)
  }
  del (key) {
    if (this.disabled) return this.nullP
    return del(key, this.store)
  }
  set (key, value) {
    if (this.disabled) return this.nullP
    return set(key, value, this.store)
  }
  put (key, value) {
    return this.set(key, value)
  }
  keys () {
    if (this.disabled) return this.nullP
    return keys(this.store)
  }
  contains (key) {
    if (this.disabled) return this.nullP
    return this.get(key).then(x => x !== undefined)
  }
  clear () {
    if (this.disabled) return this.nullP
    return clear(this.store)
  }
}
export default KeyStore
