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
        const rvm = cxt.event.target.closest('.zoom-region').__vue__
        cxt.basePos = rvm.clientXtoBase(cxt.event.clientX)
        this.$root.$emit('feature-align', cxt)
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
        const genologs = this.dataManager.getGenologs(f, this.context.strips.map(s => s.genome))
        const url = connections.MouseMine.getFastaUrl(genologs, seqtype)
        window.open(url, '_blank')
      }).bind(thisObj)
    }
  }
  //
  function makeDescriptor (stype, f, t) {
    const id = t ? (stype === 'cds' ? t.cds.ID : t.ID) : f.ID
    const len = t ? (stype === 'cds' ? t.cds.length : t.length) : f.length
    const sym = f.symbol || ''
    const gn = f.genome.name
    return {
      selected: true,
      genome: f.genome,
      type: stype,
      ID: id,
      length: len,
      header: `${gn}::${id} ${sym} (${stype})`
    }
  }
  //
  function sequenceSelectionOption (type) {
    const lbl = `All genolog ${type} sequences`
    const hlp = `Adds ${type} sequences to your cart for this feature from all currently displayed genomes.`
    return {
      icon: 'shopping_cart',
      label: lbl,
      helpText: hlp,
      disabled: cxt => cxt.feature.sotype !== 'protein_coding_gene' && type === 'cds',
      extraArgs: [type],
      handler: (function (cxt, seqtype) {
        const f = cxt.feature
        const genologs = this.dataManager.getGenologs(f, this.context.strips.map(s => s.genome)).filter(x => x)
        const seqs = genologs.map(f => {
          if (seqtype === 'dna') {
            return makeDescriptor(seqtype, f)
          } else if (seqtype === 'transcript') {
            return f.transcripts.map(t => {
              return makeDescriptor(seqtype, f, t)
            })
          } else if (seqtype === 'cds') {
            return f.transcripts.filter(t => t.cds).map(t => {
              return makeDescriptor(seqtype, f, t)
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
    {
      icon: '',
      label: `Link outs`,
      menuItems: [
        externalLinkOption('MGI', 'http://www.informatics.jax.org/accession/'),
        externalLinkOption('MouseMine', 'http://www.mousemine.org/mousemine/portal.do?class=Gene&externalids=')
      ]
    }, {
     label: 'Add sequences to cart',
     helpText: 'Add sequences to cart',
     menuItems: [
      {
        icon: 'shopping_cart',
        label: cxt => `Genomic ${cxt.feature.ID}`,
        helpText: cxt => `Genomic ${cxt.feature.ID}.`,
        handler: (function (cxt) {
          const f = cxt.feature
          if (!f) return
          this.$root.$emit('sequence-selected', [makeDescriptor('dna', f)])
        }).bind(thisObj)
      }, {
        icon: 'shopping_cart',
        label: cxt => `Transcript ${cxt.transcript ? cxt.transcript.ID : ''}`,
        helpText: cxt => `Transcript ${cxt.transcript ? cxt.transcript.ID : ''}.`,
        disabled: cxt => !cxt.transcript,
        handler: (function (cxt) {
          const f = cxt.feature
          const t = cxt.transcript
          if (!t) return
          this.$root.$emit('sequence-selected', [makeDescriptor('transcript', f, t)])
        }).bind(thisObj)
      }, {
        icon: 'shopping_cart',
        label: cxt => `CDS ${cxt.transcript && cxt.transcript.cds ? cxt.transcript.cds.ID : ''}`,
        helpText: cxt => `CDS ${cxt.transcript && cxt.transcript.cds ? cxt.transcript.cds.ID : ''}.`,
        disabled: cxt => !cxt.transcript || !cxt.transcript.cds,
        handler: (function (cxt) {
          const f = cxt.feature
          const t = cxt.transcript
          if (!t) return
          this.$root.$emit('sequence-selected', [makeDescriptor('cds', f, t)])
        }).bind(thisObj)
      },
      sequenceSelectionOption('dna'),
      sequenceSelectionOption('transcript'),
      sequenceSelectionOption('cds')
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
