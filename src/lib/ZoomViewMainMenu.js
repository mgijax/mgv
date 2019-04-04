//
import config from '@/config'
import KeyStore from '@/lib/KeyStore'
//
function getMenu (thisObj) {
  return {
    icon: 'menu',
    menuItems: [{
      /*
      icon: 'open_in_new',
      label: 'SNPs@MGI',
      helpText: 'View SNPs at MGI for the current strains in the current region. (Some strains not available.)',
      handler: (function () {
        let c = this.context.coords
        let urlBase = 'http://www.informatics.jax.org/snp/summary'
        let tabArg = 'selectedTab=1'
        let searchByArg = 'searchBySameDiff='
        let chrArg = `selectedChromosome=${c.chr.name}`
        let coordArg = `coordinate=${c.start}-${c.end}`
        let unitArg = 'coordinateUnit=bp'
        let csArgs = this.context.strips.map(s => `selectedStrains=${s.genome.name}`)
        let rsArg = `referenceStrain=${this.context.rGenome.name}`
        let linkUrl = `${urlBase}?${tabArg}&${searchByArg}&${chrArg}&${coordArg}&${unitArg}&${rsArg}&${csArgs.join('&')}`
        window.open(linkUrl, '_blank')
      }).bind(thisObj)
    }, {
      icon: 'open_in_new',
      label: 'QTL@MGI',
      helpText: 'View QTL at MGI that overlap the current region.',
      handler: (function () {
        let c = this.context.coords
        let urlBase = 'http://www.informatics.jax.org/allele/summary'
        let chrArg = `chromosome=${c.chr.name}`
        let coordArg = `coordinate=${c.start}-${c.end}`
        let unitArg = 'coordUnit=bp'
        let typeArg = 'alleleType=QTL'
        let linkUrl = `${urlBase}?${chrArg}&${coordArg}&${unitArg}&${typeArg}`
        window.open(linkUrl, '_blank')
      }).bind(thisObj)
    }, {
      icon: 'open_in_new',
      label: 'JBrowse@MGI',
      helpText: 'Open MGI JBrowse (C57BL/6J GRCm38) with the current coordinate range.',
      handler: (function () {
        let c = this.context.coords
        let urlBase = 'http://jbrowse.informatics.jax.org/'
        let dataArg = 'data=data%2Fmouse' // "data/mouse"
        let locArg = `loc=chr${c.chr.name}%3A${c.start}..${c.end}`
        let tracks = ['DNA', 'MGI_Genome_Features', 'NCBI_CCDS', 'NCBI', 'ENSEMBL']
        let tracksArg = `tracks=${tracks.join(',')}`
        let highlightArg = 'highlight='
        let linkUrl = `${urlBase}?${[dataArg, locArg, tracksArg, highlightArg].join('&')}`
        window.open(linkUrl, '_blank')
      }).bind(thisObj)
    }, {
      */
      icon: 'cached',
      label: 'Clear cache and reload',
      helpText: 'Clears data and preferences caches, and reloads the page.',
      handler: (function () {
        const kstore = new KeyStore(config.CachingFetcher.dbName)
        kstore.clear().then(() => {
          const kstore2 = new KeyStore(config.PreferencesManager.dbName)
          return kstore2.clear()
        }).then(() => {
          window.location.reload()
        })
      }).bind(thisObj)
    }]
  }
}

export default getMenu
