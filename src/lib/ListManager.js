import KeyStore from '@/lib/KeyStore'
import config from '@/config'
import u from '@/lib/utils'

class ListManager {
  constructor (app, lists) {
    this.app = app
    this.listStore = new KeyStore(config.ListManager.dbName)
    this.lists = lists
    this.listByName = {}
    this.app.$root.$on('list-delete', d => {
      this.deleteList(d.name)
    })
    this.app.$root.$on('query-returned', d => {
      this.newList(`${d.queryType.name} = ${d.query}`, d.results)
    })
    this.initFromStore()
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
  newList (name, items, color) {
    let now = new Date()
    let uname = this.uniqify(name)
    let list = {
      name: uname,
      items: items || [],
      color: color || u.randomColor(),
      created: now,
      modified: now
    }
    this.lists.push(list)
    this.listByName[uname] = list
    this.saveToStore()
    this.app.$nextTick(() => this.app.$root.$emit('list-click', list))
    return list
  }
  updateList (list, updates) {
    if (updates.name && updates.name !== list.name) {
      updates.name = this.uniqify(updates.name)
    }
    Object.assign(list, updates)
    list.modified = new Date()
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
    this.listStore.get('all').then(lists => {
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
    this.listStore.set('all', this.lists)
  }
}

export default ListManager
