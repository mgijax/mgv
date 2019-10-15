import u from '@/lib/utils'

function getMenus(thisObj) {
  //
  function alignOption () {
    return {
      icon: 'format_align_center',
      label: cxt => `Align on ${cxt.feature.label}`,
      disabled: false,
      helpText: 'Aligns the displayed genomes around this feature.',
      handler: (function (cxt) {
        cxt.op = 'feature-align'
        this.$root.$emit('region-change', cxt)
      }).bind(thisObj)
    }
  }
  //
  function externalLinkOptions () {
     return {
       icon: '',
       label: `Link outs`,
       menuItems: function(cxt) {
         const f = cxt.feature
         const lurls = this.app.runtimeConfig.linkUrls
         const lnks = u.flatten(lurls.filter(l => l.genomes.indexOf(f.genome.name) !== -1).map(l => l.links))
         return lnks.map(lnk => {
           return {
              icon: 'open_in_new',
              label: `${lnk.text}`,
              helpText: `See details for this feature at ${lnk.text}.`,
              disabled: false,
              handler: (function (cxt) {
                const u = lnk.url + f.ID
                window.open(u, '_blank')
              }).bind(thisObj)
           }
         })
       }
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
	  return `All ${type}${type === 'dna' || type === 'cds' ? ' sequences' : 's'}`
	} else {
	  return `${type} <span style="font-size: smaller;">(${ident})</span>`
	}
      },
      helpText: cxt => {
        const f = cxt.feature
	const t = cxt.transcript
	const c = t ? t.cds : null
	const target = type === 'dna' ? f : type === 'transcript' ? t : type === 'cds' ? c : f
	const ident = target ? target.ID : ''
        const all = which === 'all'
	if (all) {
          return `Adds all ${type} sequences to your cart for ${f.ID} and homologs from all currently displayed genomes.`
	} else {
          return `Adds ${type} sequence ${ident} to your cart.`
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
	  this.dataManager().getHomologs(f, this.context.strips.map(
	      s => s.genome)).filter(x => x)
	  : [f]
        const seqs = u.flatten(genologs.map(ff => {
          if (seqtype === 'dna') {
            return this.dataManager().makeSequenceDescriptor(seqtype, ff)
          } else if (seqtype === 'transcript') {
            return (all ? ff.transcripts : (t ? [t] : [])).map(tt => {
              return this.dataManager().makeSequenceDescriptor(seqtype, ff, tt)
            })
          } else if (seqtype === 'composite transcript') {
            return this.dataManager().makeSequenceDescriptor('transcript', ff, ff.composite)
          } else if (seqtype === 'cds') {
            return (all ? ff.transcripts.filter(t => t.cds) : (t.cds ? [t] : [])).map(tt => {
              return this.dataManager().makeSequenceDescriptor(seqtype, ff, tt)
            })
          } else {
            u.fail('Unknown sequence type: ' + seqtype)
          }
        }))
        this.$root.$emit('sequence-selected', { sequences : seqs, unselectAll : true })
      }).bind(thisObj)
    }
  }
  function sequenceCartOptions () {
      return {
        label: 'Add sequences to cart',
        helpText: 'Add sequences to cart',
        menuItems: [
          { label: 'This gene only' },
          sequenceSelectionOption('dna','this'),
          sequenceSelectionOption('composite transcript','this'),
          sequenceSelectionOption('transcript','this'),
          sequenceSelectionOption('cds','this'),
          { label: 'This gene and all homologs' },
          sequenceSelectionOption('dna','all'),
          sequenceSelectionOption('composite transcript','all'),
          sequenceSelectionOption('transcript','all'),
          sequenceSelectionOption('cds','all'),
       ]
     }
  }
  //
  const mouseMenu = [
    alignOption(),
    externalLinkOptions(),
    sequenceCartOptions()
  ]

  return {
    'default': mouseMenu
  }
}

export default getMenus
