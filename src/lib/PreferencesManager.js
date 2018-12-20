import KeyStore from '@/lib/KeyStore'
import config from '@/config'

class PreferencesManager {
  constructor (app) {
    this.app = app
    this.prefStore = new KeyStore(config.PreferencesManager.dbName)
  }
  getPrefs (n) {
    return this.prefStore.get(n)
  }
  setPrefs (n, p) {
    this.prefStore.set(n, p)
  }
}

export default PreferencesManager
