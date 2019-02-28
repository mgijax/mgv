import u from '@/lib/utils'
import { connections } from '@/lib/InterMineServices'
import { translate } from '@/lib/genetic_code'

function getMenus(thisObj) {
  //
  function alignOption () {
    return {
      icon: 'format_align_center',
      label: cxt => `Align on ${cxt.feature.label}`,
      disabled: false,
      helpText: 'Aligns the displayed genomes around this feature.',
      handler: (function (cxt) {
        const f = cxt.feature
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
      handler: (function (cxt, url) {
        const f = cxt.feature
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
      handler: (function (cxt, seqtype) {
        const f = cxt.feature
        const genologs = this.dataManager.getGenologs(f, this.context.vGenomes)
        const url = connections.MouseMine.getFastaUrl(genologs, seqtype)
        window.open(url, '_blank')
      }).bind(thisObj)
    }
  }
  //
  function sequenceSelectionOption (type) {
    const lbl = `Add all ${type} sequences`
    const hlp = `Adds all ${type} sequences to your cart for this feature from currently displayed genomes.`
    return {
      icon: 'shopping_cart',
      label: lbl,
      helpText: hlp,
      disabled: cxt => cxt.feature.sotype !== 'protein_coding_gene' && type === 'cds',
      extraArgs: [type],
      handler: (function (cxt, seqtype) {
        const f = cxt.feature
        const genologs = this.dataManager.getGenologs(f, this.context.vGenomes)
        const seqs = genologs.map(f => {
          if (seqtype === 'dna') {
            return {
              genome: f.genome,
              type: seqtype,
              ID: f.ID,
              header: `${f.genome.name}::${f.symbol || f.ID} (genomic)`
            }
          } else if (seqtype === 'transcript') {
            return f.transcripts.map(t => {
              return {
                genome: f.genome,
                type: seqtype,
                ID: t.tID,
                header: `${f.genome.name}::${t.tID} ${f.symbol || f.ID} (cDNA)`
              }
            })
          } else if (seqtype === 'cds') {
            return f.transcripts.filter(t => t.cds).map(t => {
              return {
                genome: f.genome,
                type: seqtype,
                ID: t.cds.ID,
                header: `${f.genome.name}::${t.cds.ID} ${f.symbol || f.ID} (CDS)`
              }
            })
          } else {
            u.fail('Unknown sequence type: ' + seqtype)
          }
        }).reduce((a,v) => {
          // flatten array where some elements are also arrays
          if (Array.isArray(v)) {
            return a.concat(v)
          } else {
            a.push(v)
            return a
          }
        }, [])
        this.$root.$emit('sequence-selected', seqs)
      }).bind(thisObj)
    }
  }
  //
  const mouseMenu = [
    alignOption(),
    externalLinkOption('MGI', 'http://www.informatics.jax.org/accession/'),
    externalLinkOption('MouseMine', 'http://www.mousemine.org/mousemine/portal.do?class=Gene&externalids='),
    {
     label: 'Add sequences to cart',
     helpText: 'Add sequences to cart',
     menuItems: [
      sequenceSelectionOption('dna'),
      sequenceSelectionOption('transcript'),
      sequenceSelectionOption('cds'),
      {
        icon: 'shopping_cart',
        label: cxt => `Add cDNA sequence ${cxt.transcript ? cxt.transcript.tID : ''}`,
        helpText: cxt => `Add cDNA sequence ${cxt.transcript ? cxt.transcript.tID : ''}.`,
        disabled: cxt => !cxt.transcript,
        handler: (function (cxt) {
          const t = cxt.transcript
          if (!t) return
          this.$root.$emit('sequence-selected', [{
            genome: cxt.feature.genome,
            ID: t.tID,
            type: 'transcript'
          }])
        }).bind(thisObj)
      }, {
        icon: 'shopping_cart',
        label: cxt => `CDS sequence ${cxt.transcript && cxt.transcript.cds ? cxt.transcript.cds.ID : ''}`,
        helpText: cxt => `CDS sequence ${cxt.transcript && cxt.transcript.cds ? cxt.transcript.cds.ID : ''}.`,
        disabled: cxt => !cxt.transcript || !cxt.transcript.cds,
        handler: (function (cxt) {
          const t = cxt.transcript
          if (!t) return
          this.$root.$emit('sequence-selected', [{
            genome: cxt.feature.genome,
            ID: t.cds.ID,
            type: 'cds'
          }])
        }).bind(thisObj)
      }
     ]
    }
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
