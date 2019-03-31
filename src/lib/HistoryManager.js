import u from '@/lib/utils'
//
class HistoryManager {
  //
  constructor (app) {
    this.app = app
    this.settingHash = false
    this.initialHash = null
    // when user hits back button, tell the app
    window.addEventListener('popstate', evt => {
      if (this.settingHash) {
        this.settingHash = false
        return
      }
      let cxt = this.pqstring(document.location.hash.substring(1))
      // console.log('HistoryManager: window state changed. Setting app context.', cxt)
      this.app.setContext(cxt, true)
    })
    // when app context changes, tell the window
    this.app.$root.$on('context-changed', () => {
      this.setHash()
    })
    // tell the app about the initial state
    let qstring = window.location.hash.substring(1)
    this.initialHash = this.pqstring(qstring)
    // console.log('HistoryManager: initial hash ', this.initialHash)
  }
  // Uses the current app context to set the hash part of the
  // browser's location. This also registers the change in
  // the browser history.
  setHash () {
    let newHash = this.app.getContextString()
    if ('#' + newHash === window.location.hash) return
    this.settingHash = true
    window.location.hash = newHash
  }
  // pqstring = Parse qstring. Parses the parameter portion of the URL.
  pqstring (qstring) {
    //
    let cfg = {}

    // FIXME: URLSearchParams API is not supported in all browsers.
    // OK for development but need a fallback eventually.
    let prms = new URLSearchParams(qstring)

    // ----- genomes ------------
    let pgenomes = prms.get('genomes') || ''
    pgenomes = pgenomes ? u.removeDups(pgenomes.trim().split(/[ ,]+/)) : []
    pgenomes.length > 0 && (cfg.genomes = pgenomes)

    // ----- ref genome ------------
    let ref = prms.get('ref')
    ref && (cfg.ref = ref)

    // ----- regions ------------
    // Regions parameter allows for multiple regions across multiple genomes
    // Example: "A/J::12:67900000..68800000,X:55622081..101002774|DBA/2J::1:1..1000000"
    //
    let regions = prms.get('regions')
    if (regions) {
      cfg.strips = regions.split(/\|/g).map(gr => {
        const bits = gr.split('::')
        const genome = bits[0]
        const gregs = bits[1].split(/,/g).map(gr => {
          const coords = gr.split(/:|[.][.]|-/g)
          return {
            genome: genome,
            chr: coords[0],
            start: parseInt(coords[1]),
            end: parseInt(coords[2])
          }
        })
        return {
          genome: genome,
          regions: gregs
        }
      })
    }

    // ----- highlight IDs --------------
    let hls0 = prms.get('highlight')
    if (hls0) {
      hls0 = hls0.replace(/[ ,]+/g, ' ').split(' ').filter(x => x)
      cfg.currentSelection = hls0
    }

    // ----- coordinates --------------
    //
    let chr = prms.get('chr')
    let start = prms.get('start')
    let end = prms.get('end')
    chr && (cfg.chr = chr)
    start && (cfg.start = parseInt(start))
    end && (cfg.end = parseInt(end))
    //
    let landmark = prms.get('landmark')
    let flank = prms.get('flank')
    let length = prms.get('length')
    let delta = prms.get('delta')
    landmark && (cfg.landmark = landmark)
    flank && (cfg.flank = parseInt(flank))
    length && (cfg.length = parseInt(length))
    delta && (cfg.delta = parseInt(delta))
    //
    // ----- drawing mode -------------
    let dmode = prms.get('dmode')
    dmode && (cfg.dmode = dmode)
    //
    return cfg
  }
}
export default HistoryManager
