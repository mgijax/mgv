
class KeyManager {
  constructor () {
    document.addEventListener('keydown', e => this.keydown(e))
    this.handlers = {}
  }
  makeKey (d) {
    const ctrl = d.ctrlKey ? 'ctrl-' : ''
    const shift = d.shiftKey ? 'shift-' : ''
    const alt = d.altKey ? 'alt-' : ''
    const meta = d.metaKey ? 'meta-' : ''
    return ctrl + shift + alt + meta + d.key
  }
  register (d) {
    const k = this.makeKey(d)
    const prev = this.handlers[k]
    this.handlers[k] = d
    return prev
  }
  keydown (e) {
    const k = this.makeKey(e)
    const d = this.handlers[k]
    if (d) {
      d.handler.call(d.thisObj, e)
    }
  }
}

export default KeyManager
