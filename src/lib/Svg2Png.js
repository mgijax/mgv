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

function svg2png (svg, fname) {
  const canvas = document.createElement('canvas')
  canvas.width = parseInt(svg.getAttribute('width'))
  canvas.height = parseInt(svg.getAttribute('height'))
  document.body.appendChild(canvas)
  const cxt = canvas.getContext('2d')
  const data = (new XMLSerializer()).serializeToString(svg)
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
  img.onerror = function (e) {
    document.body.removeChild(canvas)
  }
  img.src = url
}

export default svg2png
