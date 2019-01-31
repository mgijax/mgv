import { connections } from '@/lib/InterMineServices'

function getMenu(thisObj) {
  return [{
    icon: 'format_align_center',
    label: 'Align on this feature',
    disabled: false,
    helpText: 'Aligns the displayed genomes around this feature.',
    handler: (function (f) {
      this.$root.$emit('context', { landmark: f.id, delta: 0, currentSelection: [f.cID], ref: f.genome })
    }).bind(thisObj)
  }, {
    icon: 'open_in_new',
    label: 'Feature@MGI',
    helpText: 'See details for this feature at MGI.',
    disabled: false,
    handler: (function (f) {
      let url = `http://www.informatics.jax.org/accession/${f.id}`
      window.open(url, '_blank')
    }).bind(thisObj)
  }, {
    icon: 'open_in_new',
    label: 'Feature@MouseMine',
    helpText: 'See details for this feature at MouseMine.',
    disabled: false,
    handler: (function (f) {
      let url = `http://www.mousemine.org/mousemine/portal.do?class=Gene&externalids=${f.id}`
      window.open(url, '_blank')
    }).bind(thisObj)
  }, {
    icon: 'cloud_download',
    label: 'Genomic sequences',
    helpText: 'Download genomic sequences for this feature from currently displayed genomes.',
    disabled: false,
    handler: (function (f) {
      let url = connections.MouseMine.getFastaUrl(this.dataManager.getGenologs(f, this.context.vGenomes), 'genomic')
      window.open(url, '_blank')
    }).bind(thisObj)
  }, {
    icon: 'cloud_download',
    label: 'Transcript sequences',
    helpText: 'Download transcript sequences for this feature from currently displayed genomes.',
    disabled: false,
    handler: (function (f) {
      let url = connections.MouseMine.getFastaUrl(this.dataManager.getGenologs(f, this.context.vGenomes), 'transcript')
      window.open(url, '_blank')
    }).bind(thisObj)
  }, {
    icon: 'cloud_download',
    label: 'CDS sequences',
    helpText: 'Download coding sequences for this feature from currently displayed genomes.',
    disabled: function (f) {
      return f.sotype !== 'protein_coding_gene'
    },
    handler: (function (f) {
      let url = connections.MouseMine.getFastaUrl(this.dataManager.getGenologs(f, this.context.vGenomes), 'cds')
      window.open(url, '_blank')
    }).bind(thisObj)
  }, {
    icon: 'cloud_download',
    label: 'Exon sequences',
    helpText: 'Download exon sequences for this feature from currently displayed genomes.',
    disabled: false,
    handler: (function (f) {
      let url = connections.MouseMine.getFastaUrl(this.dataManager.getGenologs(f, this.context.vGenomes), 'exon')
      window.open(url, '_blank')
    }).bind(thisObj)
  }]
}

export default getMenu
