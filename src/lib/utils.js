import Vue from 'vue'
import gff from '@/lib/gff3lite'

//
function fail (e) {
  throw e
}
//
function assert (cond, message) {
  if (!cond) fail(`Assertion error${message ? ': ' + message : ''}`)
}
// Returns an index over the items in the given list using the given key, which is assumed unique.
// Key may be a string (attribute name) or a function which returns a string when passed a list item.
// If key is not specified, the item itself is used as the key (useful for indexing lists of words).
// If unique is unspecified or is true, builds a unique index - each key maps to one element.
// If unique is false, builds a non-unique index - each kep maps to a list of elements.
//
function index (list, key, unique) {
  let fkey
  if (typeof key === 'string') fkey = (x) => x[key]
  else if (typeof key === 'function') fkey = key
  else fkey = (x) => x
  //
  if (unique === false) {
    return list.reduce((ix, item) => {
      let k = fkey(item)
      if (!(k in ix)) ix[k] = []
      ix[k].push(item)
      return ix
    }, {})
  } else {
    return list.reduce((ix, item) => {
      ix[fkey(item)] = item
      return ix
    }, {})
  }
}
// ---------------------------------------------
// Removes duplicates from a list while preserving list order.
// Args:
//     lst (list)
// Returns:
//     A processed copy of lst in which any dups have been removed.
function removeDups (lst) {
  let lst2 = []
  let seen = new Set()
  lst.forEach(x => {
    // remove dups while preserving order
    if (seen.has(x)) return
    lst2.push(x)
    seen.add(x)
  })
  return lst2
}
// Make an element draggable by attaching drag behavior.
//
// Args:
//   elt (DOM node) the element to make draggable
//   behavior (object) Object containing drag event handlers.
//      dragstart: called at the start of the drag (on mousedown).
//          This handler can return false to cancel the drag/
//      drag: called during the drag (on mousemove)
//      dragend: called at the end of the drag (on mouseup)
//   root (SVG node) - the root of 'draggification' where drag and
//      dragend events are detected. Must elt or an ancestor. Optional.
//      Default is elt. (FIXME: should be document.body)
//
// All handlers are passed two arguments:
//    evt: the actual mouse event (mousedown, mousemove, mouseup)
//    data: an object carrying essential drag data. Handlers are free
//          to attach additional fields as needed.
//      target - same as evt.target
//      startX, startY - the starting client coordinates of the drag
//      deltaX, deltaY - the total distace traveled since dragstart
//
// Only onmousedown is listened for initially. When mousedown is detected
// (ie on dragstart) the handlers for mousemove and mouseup are attached
// to the root node. On mouseup (dragend) they are removed. This avoids the
// handlers being called outside of a drag operation.
//
function dragify (elt, behavior, root, dragThis) {
  behavior = behavior || {}
  root = root || elt
  let dragging
  function startDrag (evt) {
    dragging = {
      target: evt.target,
      startX: evt.clientX,
      startY: evt.clientY,
      deltaX: 0,
      deltaY: 0
    }
    if (behavior.dragstart && behavior.dragstart.call(dragThis, evt, dragging) === false) {
      dragging = null
      return
    }
    root.addEventListener('mousemove', drag)
    root.addEventListener('mouseup', endDrag)
    root.addEventListener('mouseleave', endDrag)
    evt.stopPropagation()
    evt.preventDefault()
    // console.log('START DRAG')
  }
  function drag (evt) {
    if (!dragging) return
    dragging.deltaX = evt.clientX - dragging.startX
    dragging.deltaY = evt.clientY - dragging.startY
    behavior.drag && behavior.drag.call(dragThis, evt, dragging)
    evt.stopPropagation()
    evt.preventDefault()
    // console.log('DRAG')
  }
  function endDrag (evt) {
    if (!dragging) return
    behavior.dragend && behavior.dragend.call(dragThis, evt, dragging)
    dragging = null
    root.removeEventListener('mousemove', drag)
    root.removeEventListener('mouseup', endDrag)
    root.removeEventListener('mouseleave', endDrag)
    evt.stopPropagation()
    evt.preventDefault()
    // console.log('END DRAG')
  }
  elt.addEventListener('mousedown', startDrag)
}

//
function randomColor () {
  let hx = n => {
    let h = n.toString(16)
    if (h.length === 1) h = '0' + h
    return h
  }
  let rand = () => Math.floor(Math.random() * 256)
  let r = hx(rand())
  let g = hx(rand())
  let b = hx(rand())
  // return `rgb(${r},${g},${b})`
  return `#${r}${g}${b}`
}
//
function afterTicks (nTicks, fcn, thisObj, ...args) {
  if (nTicks > 0) {
    let f = () => afterTicks(nTicks - 1, fcn, thisObj, ...args)
    Vue.nextTick(f)
  } else {
    fcn.call(thisObj, ...args)
  }
}
//
function eachTick (nTicks, fcn, thisObj, ...args) {
  if (nTicks > 0) {
    let f = () => {
      fcn.call(thisObj, ...args)
      afterTicks(nTicks - 1, fcn, thisObj, ...args)
    }
    Vue.nextTick(f)
  }
}
//
// ---------------------------------------------
// Returns the given basepair amount "pretty printed" to an apporpriate scale, precision, and units.
// Eg,
//    127 => '127 bp'
//    123456789 => '123.5 Mb'
function prettyPrintBases (n) {
  let absn = Math.abs(n)
  if (absn < 1000) {
    return `${n} bp`
  }
  if (absn >= 1000 && absn < 1000000) {
    return `${(n/1000).toFixed(2)} kb`
  }
  else {
    return `${(n/1000000).toFixed(2)} Mb`
  }
}
// ---------------------------------------------
//
function fetch (url, type) {
  const types = ['text', 'json', 'gff3']
  if (!type) type = 'text'
  if (types.indexOf(type) === -1) return Promise.reject('Unknown type: ' + type)
  return self.fetch(url).then(r => {
    switch (type) {
    case 'text':
      return r.text()
    case 'json':
      return r.json()
    case 'gff3':
      return r.text().then(t => gff.parseFile(t))
    default:
      fail('Unknown type: ' + type)
    }
  })
}
// ---------------------------------------------
function concatAll (listOfLists) {
  return [].concat.apply([], listOfLists)
}
// ---------------------------------------------
// Returns the unique items from list, based on the provided key function.
// Items are returns in order of ther first appearance in the list.
function uniqueItems (list, key) {
  key = key || (x => x)
  const seen = new Set
  return list.map(item => {
    const k = key(item)
    if (seen.has(k)) return null
    seen.add(k)
    return item
  }).filter(x => x)
}
// ---------------------------------------------
export default {
  fail,
  concatAll,
  assert,
  index,
  dragify,
  removeDups,
  randomColor,
  afterTicks,
  eachTick,
  prettyPrintBases,
  fetch,
  uniqueItems
}
