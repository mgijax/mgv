import { connections } from '@/lib/InterMineServices'

function getMenu(thisObj) {
  //
  const alignHandler = (function (f) {
    this.$root.$emit('context', { landmark: f.id, delta: 0, currentSelection: [f.cID], ref: f.genome })
  }).bind(thisObj)
  //
  const seqDownloadHandler = (function (f, seqtype) {
    const genologs = this.dataManager.getGenologs(f, this.context.vGenomes)
    const url = connections.MouseMine.getFastaUrl(genologs, seqtype)
    window.open(url, '_blank')
  }).bind(thisObj)
  //
  const externalLinkHandler = (function (f, url) {
    const u = url + f.id
    window.open(u, '_blank')
  }).bind(thisObj)
  //
  return [{
    icon: 'format_align_center',
    label: 'Align on this feature',
    disabled: false,
    helpText: 'Aligns the displayed genomes around this feature.',
    handler: alignHandler
  }, {
    icon: 'open_in_new',
    label: 'Feature@MGI',
    helpText: 'See details for this feature at MGI.',
    disabled: false,
    extraArgs: ['http://www.informatics.jax.org/accession/'],
    handler: externalLinkHandler
  }, {
    icon: 'open_in_new',
    label: 'Feature@MouseMine',
    helpText: 'See details for this feature at MouseMine.',
    disabled: false,
    extraArgs: ['http://www.mousemine.org/mousemine/portal.do?class=Gene&externalids='],
    handler: externalLinkHandler
  }, {
    icon: 'cloud_download',
    label: 'Genomic sequences',
    helpText: 'Download genomic sequences for this feature from currently displayed genomes.',
    disabled: false,
    extraArgs: ['genomic'],
    handler: seqDownloadHandler
  }, {
    icon: 'cloud_download',
    label: 'Transcript sequences',
    helpText: 'Download transcript sequences for this feature from currently displayed genomes.',
    disabled: false,
    extraArgs: ['transcript'],
    handler: seqDownloadHandler
  }, {
    icon: 'cloud_download',
    label: 'CDS sequences',
    helpText: 'Download coding sequences for this feature from currently displayed genomes.',
    disabled: function (f) { return f.sotype !== 'protein_coding_gene' },
    extraArgs: ['cds'],
    handler: seqDownloadHandler
  }, {
    icon: 'cloud_download',
    label: 'Exon sequences',
    helpText: 'Download exon sequences for this feature from currently displayed genomes.',
    disabled: false,
    extraArgs: ['exon'],
    handler: seqDownloadHandler
  }]
}

export default getMenu
