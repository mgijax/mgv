import u from '@/lib/utils'
import { connections } from '@/lib/InterMineServices'
import { translate } from '@/lib/genetic_code'

function getMenus(thisObj) {
  //
  function alignOption () {
    return {
      icon: 'format_align_center',
      label: 'Align on this feature',
      disabled: false,
      helpText: 'Aligns the displayed genomes around this feature.',
      handler: (function (f) {
        this.$root.$emit('context', { landmark: f.id, delta: 0, currentSelection: [f.cID], ref: f.genome })
      }).bind(thisObj)
    }
  }
  //
  function externalLinkOption (name, url) {
    return {
      icon: 'open_in_new',
      label: `Feature@${name}`,
      helpText: `See details for this feature at ${name}.`,
      disabled: false,
      extraArgs: [url],
      handler: (function (f, url) {
        const u = url + f.ID
        window.open(u, '_blank')
      }).bind(thisObj)
    }
  }
  //
  function sequenceDownloadOption (type) {
    return {
      icon: 'cloud_download',
      label: `Download ${type} sequences`,
      helpText: `Download ${type} sequences for this feature from currently displayed genomes.`,
      disabled: f => f.sotype !== 'protein_coding_gene' && type === 'cds',
      extraArgs: [type],
      handler: (function (f, seqtype) {
        const genologs = this.dataManager.getGenologs(f, this.context.vGenomes)
        const url = connections.MouseMine.getFastaUrl(genologs, seqtype)
        window.open(url, '_blank')
      }).bind(thisObj)
    }
  }
  //
  function sequenceAlignmentOption (type) {
    const tp = type === 'cds' ? 'protein' : type
    const lbl = `Align ${tp} sequences`
    const hlp = `Align ${tp} sequences for this feature from currently displayed genomes.`
    return {
      icon: 'reorder',
      label: lbl,
      helpText: hlp,
      disabled: f => f.sotype !== 'protein_coding_gene' && type === 'cds',
      extraArgs: [type],
      handler: (function (f, seqtype) {
        const genologs = this.dataManager.getGenologs(f, this.context.vGenomes)
        const url = connections.MouseMine.getFastaUrl(genologs, seqtype)
        u.fetch(url, 'text').then(t => {
          if (seqtype === 'cds') {
            // Translate cds sequences to protein.
            // First concatenate all the lines of nucleic acid sequence.
            const lines = t.trim().split('\n').reduce((a,l) => {
              if (l[0] === '>' || a[a.length - 1][0] === '>') {
                a.push(l)
              } else {
                a[a.length - 1] += l
              }
              return a
            }, [])
            // Then call translate on each sequence.
            t = lines.map(l => l[0] === '>' ? l : translate(l)).join('\n')
          }
          this.context.msaSequences = [t]
        })
      }).bind(thisObj)
    }
  }
  //
  const mouseMenu = [
    alignOption(),
    externalLinkOption('MGI', 'http://www.informatics.jax.org/accession/'),
    externalLinkOption('MouseMine', 'http://www.mousemine.org/mousemine/portal.do?class=Gene&externalids='),
    sequenceDownloadOption('genomic'),
    sequenceDownloadOption('transcript'),
    sequenceDownloadOption('cds'),
    sequenceDownloadOption('exon'),
    sequenceAlignmentOption('transcript'),
    sequenceAlignmentOption('cds')
  ]
  // 
  const humanMenu = [
    alignOption(),
    externalLinkOption('Ensembl', 'http://www.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g='),
    externalLinkOption('HumanMine', 'http://www.humanmine.org/humanmine/portal.do?class=Gene&externalids=')
  ]
  // 
  const ratMenu = [
    alignOption(),
    externalLinkOption('Ensembl', 'http://www.ensembl.org/Rattus_norvegicus/Gene/Summary?db=core;g=')
  ]

  return {
    '10089': mouseMenu,
    '10090': mouseMenu,
    '10093': mouseMenu,
    '10096': mouseMenu,
    '10116': ratMenu,
    '9606': humanMenu,
    'default': [ alignOption() ]
  }
}

export default getMenus
