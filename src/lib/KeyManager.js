
class KeyManager {
  constructor () {
    document.addEventListener('keydown', e => this.keydown(e))
    this.handlers = {}
  }
  register (d) {
    if (this.handlers[d.key]) {
      this.handlers[d.key].push(d)
    } else {
      this.handlers[d.key] = [ d ]
    }
  }
  findHandlers (e) {
    return (this.handlers[e.key] || []).filter(d => {
      if ('ctrlKey' in d && d.ctrlKey !== e.ctrlKey) return false
      if ('shiftKey' in d && d.shiftKey !== e.shiftKey) return false
      if ('altKey' in d && d.altKey !== e.altKey) return false
      if ('metaKey' in d && d.metaKey !== e.metaKey) return false
      return true
    })
  }
  keydown (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
    const handlers = this.findHandlers(e)
    handlers.forEach(d => d.handler.call(d.thisObj, e))
  }
}

export default KeyManager
