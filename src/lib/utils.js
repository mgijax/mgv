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
//      dragend events are detected. Must be elt or an ancestor. Optional.
//      Default is elt. (FIXME: should be document.body)
//
// All handlers are passed two arguments:
//    evt: the actual mouse event (mousedown, mousemove, mouseup)
//    data: an object carrying essential drag data. Handlers are free
//          to attach additional fields as needed.
//      target - same as evt.target
//      startX, startY - the starting client coordinates of the drag
//      deltaX, deltaY - the total distace traveled since dragstart
//      cancel - a function to call if you want to cancel the drag
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
    if (evt.ctrlKey) return
    dragging = {
      target: evt.target,
      startX: evt.clientX,
      startY: evt.clientY,
      deltaX: 0,
      deltaY: 0,
      cancel: () => cancelDrag()
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
  function cancelDrag () {
    behavior.dragcancel && behavior.dragcancel.call(dragThis, dragging)
    root.removeEventListener('mousemove', drag)
    root.removeEventListener('mouseup', endDrag)
    root.removeEventListener('mouseleave', endDrag)
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
// Returns the given basepair amount "pretty printed". 
// If the second arg, commas, is true, returns the number as a string using commas as separator.
// Otherwise, formats the number to an apporpriate scale, precision, and units.
// Eg,
//    127 => '127 bp'
//    123456789 => '123.5 Mb'
function prettyPrintBases (n, commas) {
  if (commas) {
    // https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }
  let absn = Math.abs(n)
  if (absn < 1000) {
    return `${n} bp`
  }
  if (absn >= 1000 && absn < 1000000) {
    return `${(n/1000).toFixed(1)} kb`
  }
  else {
    return `${(n/1000000).toFixed(1)} Mb`
  }
}
// ---------------------------------------------
//
function deepCopy (obj) {
  return JSON.parse(JSON.stringify(obj))
}

// ---------------------------------------------
// A higher-level fetch that parses responses.
// Args:
//  url: URL to fetch from or post to (if postData is provided)
//  type: expected type of the response (text, json, or gff3)
//  postData: if provided, a URL-encoded string, eg, "name=Joel&age=60"
function fetch (url, type, postData) {
  const types = ['text', 'json', 'gff3']
  if (!type) type = 'text'
  if (types.indexOf(type) === -1) return Promise.reject('Unknown type: ' + type)
  //
  function status(response) {
    if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response)
    } else {
        return Promise.reject(new Error(response.statusText))
    }
  }
  //
  let opts = undefined
  if (postData) {
    opts = {
      method: 'POST',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      body: postData
    }
  }
  return  self.fetch(url, opts).then(status).then(r => {
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
// https://stackoverflow.com/questions/4987309/screen-width-vs-visible-portion
function wWidth(){
   return window.innerWidth 
       || document.documentElement.clientWidth 
       || document.body.clientWidth 
       || 0;
}
function wHeight(){
   return window.innerHeight 
       || document.documentElement.clientHeight 
       || document.body.clientHeight 
       || 0;
}
// ---------------------------------------------
// https://stackoverflow.com/questions/19618545/body-scrolltop-vs-documentelement-scrolltop-vs-window-pageyoffset-vs-window-scro
function wScrollTop () {
  return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
}
// ---------------------------------------------
// https://stackoverflow.com/questions/6562727/is-there-a-function-to-deselect-all-text-using-javascript
function unselectAllText () {
 if (window.getSelection) {
   window.getSelection().removeAllRanges()
 } else if (document.selection) {
   document.selection.empty()
 }
}
// ---------------------------------------------
// https://stackoverflow.com/questions/4947682/intelligently-calculating-chart-tick-positions
function niceNumber(value, round_){
    //default value for round_ is false
    round_ = round_ || false;
    // :latex: \log_y z = \frac{\log_x z}{\log_x y}
    const exponent = Math.floor(Math.log(value) / Math.log(10));
    const fraction = value / Math.pow(10, exponent);
    let nice_fraction

    if (round_)
        if (fraction < 1.5)
            nice_fraction = 1.
        else if (fraction < 3.)
            nice_fraction = 2.
        else if (fraction < 7.)
            nice_fraction = 5.
        else
            nice_fraction = 10.
    else
        if (fraction <= 1)
            nice_fraction = 1.
        else if (fraction <= 2)
            nice_fraction = 2.
        else if (fraction <= 5)
            nice_fraction = 5.
        else
            nice_fraction = 10.

    return nice_fraction * Math.pow(10, exponent)
}

function niceBounds(axis_start, axis_end, num_ticks){
    //default value is 10
    num_ticks = num_ticks || 10;
    let axis_width = axis_end - axis_start;

    if (axis_width == 0){
        axis_start -= .5
        axis_end += .5
        axis_width = axis_end - axis_start
    }

    const nice_range = niceNumber(axis_width);
    const nice_tick = niceNumber(nice_range / (num_ticks -1), true);
    axis_start = Math.floor(axis_start / nice_tick) * nice_tick;
    axis_end = Math.ceil(axis_end / nice_tick) * nice_tick;
    return {
        "min": axis_start,
        "max": axis_end,
        "steps": nice_tick
    }
}
//--------------------------------------
// Merges array B into array A.
// Calls mergeItems for each pair of items (a,b)
// Truncates A if B is shorter.
// Extends A if B is longer (just appends the b's)
function mergeArrays (A, B, mergeItems) {
  const alen = A.length
  const blen = B.length
  if (blen < alen) {
    A.splice(blen, alen - blen)
    A.forEach((a, i) => mergeItems(a, B[i]))
  } else if (blen > alen) {
    A.forEach((a, i) => mergeItems(a, B[i]))
    A.splice.apply(A, [A.length, 0].concat(B.slice(alen)))
  } else {
    A.forEach((a, i) => mergeItems(a, B[i]))
  }
}

//--------------------------------------
// Recursively flattens arrays of arrays.
function flatten (lst) {
    return lst.reduce((a,v) => {
      if (Array.isArray(v)) {
	a = a.concat(flatten(v))
      } else {
	a.push(v)
      }
      return a
    }, [])
}
// ---------------------------------------------
// Returns a list of DOMClientRect objects for the given list
// of components, optionally sorted as specified.
// Each component is added as a 'component' attribute to its rect object.
// If specified, sortedBy is the name of an attribite in DOMClientRect,
// e.g., 'x' or 'y'.
// 
function getBBoxes(components, sortedBy) {
  const kids = components.map(c => {
    const r = c.$el.getBoundingClientRect()
    r.component = c
    return r
  })
  if (sortedBy) {
    kids.sort((a,b) => a[sortedBy] - b[sortedBy])
  }
  return kids
}
// ---------------------------------------------
function sortBy (lst, key) {
  let kf
  const ktype = typeof(key)
  if (ktype === "string") {
    kf = x => x[key]
  } else if (ktype === "function") {
    kf = key
  } else {
    kf = x => x
  }
  const comp = function(a, b) {
    const av = kf(a)
    const bv = kf(b)
    return av < bv ? -1 : av > bv ? 1 : 0
  }
  return lst.sort(comp)
}
// ---------------------------------------------
export default {
  afterTicks,
  assert,
  concatAll,
  deepCopy,
  dragify,
  eachTick,
  fail,
  fetch,
  flatten,
  getBBoxes,
  index,
  mergeArrays,
  niceBounds,
  prettyPrintBases,
  randomColor,
  removeDups,
  sortBy,
  uniqueItems,
  unselectAllText,
  wHeight,
  wScrollTop,
  wWidth
}
