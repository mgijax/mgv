// Adapted from: 
//   https://stackoverflow.com/questions/28226677/save-inline-svg-as-jpeg-png-svg
// FireFox issue:
//   https://stackoverflow.com/questions/28690643/firefox-error-rendering-an-svg-image-to-html5-canvas-with-drawimage
// Safari issue:
//   https://stackoverflow.com/questions/23114686/safari-image-onload-event-not-firing-with-blob-url

function triggerDownload (imgURI, fname) {
  const evt = new MouseEvent('click', {
    view: window,
    bubbles: false,
    cancelable: true
  })
  const a = document.createElement('a')
  a.setAttribute('download', fname)
  a.setAttribute('href', imgURI)
  a.setAttribute('target', '_blank')
  a.dispatchEvent(evt)
}

function svg2png (svg, width, height, fname) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  document.body.appendChild(canvas)
  const cxt = canvas.getContext('2d')
  let data = (new XMLSerializer()).serializeToString(svg)
  // Problem if the svg element has no explicit width
  const svgBB = svg.getBoundingClientRect()
  data = data.replace('height', `width="${svgBB.width}" height`)
  //
  const DOMURL = window.URL || window.webkitURL || window
  const img = new Image()
  const svgBlob = new Blob([data], {type: 'image/svg+xml'})
  const url = DOMURL.createObjectURL(svgBlob)
  img.onload = function () {
    cxt.drawImage(img, 0, 0)
    DOMURL.revokeObjectURL(url)
    const imgURI = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream')
    triggerDownload(imgURI, fname)
    document.body.removeChild(canvas)
  }
  img.onerror = function () {
    document.body.removeChild(canvas)
  }
  img.src = url
}

// From: https://stackoverflow.com/questions/23218174/how-do-i-save-export-an-svg-file-after-creating-an-svg-with-d3-js-ie-safari-an
function svg2file(svg, name) {
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  var svgData = svg.outerHTML
  var preface = '<?xml version="1.0" standalone="no"?>\r\n'
  var svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"})
  var svgUrl = URL.createObjectURL(svgBlob)
  var downloadLink = document.createElement("a")
  downloadLink.href = svgUrl
  downloadLink.download = name
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}

export {
  svg2png,
  svg2file
}
