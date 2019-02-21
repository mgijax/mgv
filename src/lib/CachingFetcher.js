import u from '@/lib/utils'
import KeyStore from '@/lib/KeyStore'

class CachingFetcher {
  // Args:
  //  cacheName (string) Name to use for the IndexedDB cache
  //  namespace (string) optional. If provided, prefixes all cache keys with this value.
  constructor (cacheName, namespace) {
    this.kstore = new KeyStore(cacheName)
    this.namespace = namespace || ''
  }
  // Returns a promise for the content at the specified url.
  // Returns results from the cache if found, else fetches over the net, then caches and returns it.
  // Args:
  //   url (string) the URL to fetch
  //   type (string) one of: text, json, gff3
  fetch (url, type, namespace) {
    const key = `${this.namespace}::${type}::${url}`
    return this.kstore.get(key).then(cachedval => {
      if (cachedval === undefined) {
        return u.fetch(url, type).then(val => {
          this.kstore.set(key, val)
          return val
        })
      } else {
        return cachedval
      }
    })
  }
  // Removes all entries under my namespace. Returns a promise that resolves when all keys removed.
  clearNamespace () {
    return this.kstore.keys().then(keys => {
      const mykeys = keys.filter(k => k.startsWith(this.namespace+'::'))
      return Promise.all(mykeys.map(k => this.kstore.del(k)))
    })
  }
}

export default CachingFetcher
