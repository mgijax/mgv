import KeyStore from '@/lib/KeyStore'
import config from '@/config'
import u from '@/lib/utils'
import ListFormulaEvaluator from '@/lib/ListFormulaEvaluator'

class ListManager {
  constructor (app, lists) {
    this.app = app
    this.listStore = new KeyStore(config.ListManager.dbName)
    this.lists = lists
    this.lfe = new ListFormulaEvaluator(this)
    this.listByName = {}
    this.app.$root.$on('list-delete', d => {
      this.deleteList(d.name)
    })
    this.app.$root.$on('query-returned', d => {
      const formula = `?"${d.queryType.name} = ${d.query}"`
      this.newList(`${d.queryType.name} = ${d.query}`, d.results, null, formula)
    })
    this.initFromStore()
    this.recoverVersion1Lists()
  }
  uniqify (n) {
    if (!this.listByName[n]) return n
    let count = 0
    let nn = n
    while (nn in this.listByName) {
      count += 1
      nn = `${n} (${count})`
    }
    return nn
  }
  newList (name, items, color, formula, description) {
    let now = new Date()
    let uname = this.uniqify(name)
    let list = {
      name: uname,
      items: items || [],
      formula: formula || "",
      description: description || "",
      color: color || u.randomColor(),
      created: now,
      modified: now
    }
    this.lists.push(list)
    this.listByName[uname] = list
    this.saveToStore()
    this.app.$nextTick(() => this.app.$root.$emit('list-click', { list: list, event: { shiftKey: true }}))
    return list
  }
  getDependents (lst) {
    return this.lists.map(l => [l,this.lfe.getDependencies(l)]).filter(p => p[1].indexOf(lst) >= 0).map(p => p[0])
  }
  updateList (list, updates) {
    if (updates.name && updates.name !== list.name) {
      updates.name = this.uniqify(updates.name)
      delete this.listByName[list.name]
      this.listByName[updates.name] = list
    }
    // cannot change the creation date
    const cdate = list.created
    Object.assign(list, updates)
    list.created = cdate
    // update modification date
    list.modified = new Date()
    //
    this.saveToStore()
    return list
  }
  getList (name) {
    return this.listByName[name]
  }
  deleteList (name) {
    let lst = this.getList(name)
    if (!lst) return false
    delete this.listByName[name]
    let i = this.lists.indexOf(lst)
    this.lists.splice(i, 1)
    this.saveToStore()
    return true
  }
  initFromStore () {
    this.lists.splice(0, this.lists.length)
    this.listByName = {}
    return this.listStore.get('all').then(lists => {
      if (lists) {
        lists.forEach(l => {
          this.lists.push(l)
          this.listByName[l.name] = l
        })
        console.log(`ListManager: loaded ${this.lists.length} lists from store`)
      } else {
        console.log(`ListManager: loaded 0 lists from store`)
      }
    })
  }
  saveToStore () {
    console.log(`ListManager: saving ${this.lists.length} lists to store`)
    return this.listStore.set('all', this.lists)
  }
  recoverVersion1Lists () {
    const name = 'mgv-datacache-user-lists'
    const store = new KeyStore(name, 'user-lists')
    return store.get('all').then(listDict => {
      if (!listDict) return
      const doImport = confirm(
        'It looks like you have saved lists from a previous version. Would you like to import them?')
      if (doImport) {
        for (const n in listDict) {
          const lst = listDict[n]
          this.newList( lst.name, lst.ids.concat(), u.randomColor(), lst.formula, "" )
        }
        if(confirm('Delete the old lists?')) {
          indexedDB.deleteDatabase(name)
        }
      }
    })
  }
}

export default ListManager
