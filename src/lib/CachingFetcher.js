import u from '@/lib/utils'
import KeyStore from '@/lib/KeyStore'

class CachingFetcher {
  // Args:
  //  cacheName (string) Name to use for the IndexedDB cache
  constructor (cacheName) {
    this.kstore = new KeyStore(cacheName)
  }
  // Returns a promise for the content at the specified url.
  // Returns results from the cache if found, else fetches over the net, then caches and returns it.
  // Args:
  //   url (string) the URL to fetch
  //   type (string) one of: text, json, gff3
  fetch (url, type) {
    const key = `${type}::${url}`
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
  // Clears the url cache
  clear () {
    return this.kstore.clear()
  }
}

export default CachingFetcher
