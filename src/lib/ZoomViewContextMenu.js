import u from '@/lib/utils'
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
  // type = one of: dna, transcript, cds
  // which = one of: this, all
  function sequenceSelectionOption (type, which) {
    return {
      icon: 'shopping_cart',
      label: cxt => {
        const f = cxt.feature
	const t = cxt.transcript
	const c = t ? t.cds : null
	const target = type === 'dna' ? f : type === 'transcript' ? t : type === 'cds' ? c : f
	const ident = target ? target.ID : ''
        const all = which === 'all'
	if (all) {
	  return `${f.ID} and genologs, all ${type}`
	} else {
	  return `${ident} ${type}`
	}
      },
      helpText: cxt => {
        const f = cxt.feature
	const t = cxt.transcript
	const c = t ? t.cds : null
	const ident = (c || t || f).ID
        const all = which === 'all'
	if (all) {
          return `Adds ${type} sequences to your cart for ${f.ID} from all currently displayed genomes.`
	} else {
          return `Adds ${type} sequence to your cart for feature ${ident}.`
	}
      },
      disabled: cxt => {
        const f = cxt.feature
	const t = cxt.transcript
	const c = t ? t.cds : null
        const all = which === 'all'
        return (
	  (which === 'this' && type === 'transcript' && !t) ||
	  (which === 'this' && type === 'cds' && !c) ||
	  (f.sotype !== 'protein_coding_gene' && type === 'cds'))
      },
      extraArgs: [type],
      handler: (function (cxt, seqtype) {
        const f = cxt.feature
	const t = cxt.transcript
	const c = t ? t.cds : null
        const all = which === 'all'
	const genologs = all ?
	  this.dataManager().getGenologs(f, this.context.strips.map(
	      s => s.genome)).filter(x => x)
	  : [f]
        const seqs = u.flatten(genologs.map(ff => {
          if (seqtype === 'dna') {
            return this.dataManager().makeSequenceDescriptor(seqtype, ff)
          } else if (seqtype === 'transcript') {
            return (t ? [t] : all ? ff.transcripts : []).map(tt => {
              return this.dataManager().makeSequenceDescriptor(seqtype, ff, tt)
            })
          } else if (seqtype === 'composite transcript') {
            return this.dataManager().makeSequenceDescriptor('transcript', ff, ff.composite)
          } else if (seqtype === 'cds') {
            return (c ? [t] : all ? ff.transcripts.filter(t => t.cds) : []).map(cc => {
              return this.dataManager().makeSequenceDescriptor(seqtype, ff, cc)
            })
          } else {
            u.fail('Unknown sequence type: ' + seqtype)
          }
        }))
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
      sequenceSelectionOption('dna','this'),
      sequenceSelectionOption('composite transcript','this'),
      sequenceSelectionOption('transcript','this'),
      sequenceSelectionOption('cds','this'),
      sequenceSelectionOption('dna','all'),
      sequenceSelectionOption('composite transcript','all'),
      sequenceSelectionOption('transcript','all'),
      sequenceSelectionOption('cds','all')
     ]
    }
  ]

  return {
    '10089': mouseMenu,
    '10090': mouseMenu,
    '10093': mouseMenu,
    '10096': mouseMenu,
    'default': [ alignOption() ]
  }
}

export default getMenus
