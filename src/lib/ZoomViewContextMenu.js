import u from './utils.js'

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
        this.$root.ebus.emit('region-change', cxt)
      }).bind(thisObj)
    }
  }
  //
  function externalLinkOptions () {
     return {
       icon: '',
       label: `Link outs`,
       disabled: cxt => {
           const los = cxt.feature.genome.linkouts || []
           return los.length == 0
       },
       menuItems: function(cxt) {
         const f = cxt.feature
         const lnks = f.genome.linkouts || []
         return lnks.map(lnk => {
           return {
              icon: 'open_in_new',
              label: `${lnk.text}`,
              helpText: `See details for this feature at ${lnk.text}.`,
              disabled: false,
              handler: (function () {
                let ident = f[lnk.attr]
                if (lnk.stripPrefix) ident = ident.replace(/^[^:]+:/, "")
                const u = lnk.url + ident
                window.open(u, '_blank')
              }).bind(thisObj)
           }
         })
       }
     }
  }
  // type = one of: dna, transcript, cds
  // whichGene = one of: target, all
  // whichTxp = optional, one of: target, all
  function sequenceSelectionOption (type, whichGene, whichTxp) {
    return {
      icon: 'shopping_cart',
      label: cxt => {
        const f = cxt.feature
        const t = cxt.transcript
        const c = t ? t.cds : null
        const target = type === 'dna' ? f : type === 'transcript' ? t : type === 'cds' ? c : f
        const ident = target ? target.label : ''
        const all = whichGene === 'all'
        const allT = whichTxp === 'all'
        if (all || allT) {
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
        const all = whichGene === 'all'
        const allT = whichTxp === 'all'
        const xtra = type !== 'composite transcript' ? '' :
            ' A composite transcript is constructed for each gene by unioning the exons of its actual transcripts.'
        if (all || allT) {
          const homPart = all ? ' and homologs from all currently displayed genomes' : ''
          return `Adds all ${type} sequences to your cart for ${f.ID}${homPart}. ${xtra}`
        } else {
          return `Adds ${type} sequence ${ident} to your cart. ${xtra}`
        }
      },
      disabled: cxt => {
        const f = cxt.feature
        const t = cxt.transcript
        const c = t ? t.cds : null
        const allT = whichTxp === 'all'
        return (
          (whichGene === 'target' && type === 'transcript' && !t && !allT) ||
          (whichGene === 'target' && type === 'cds' && !c && !allT) ||
          (f.type !== 'protein_coding_gene' && type === 'cds'))
      },
      extraArgs: [type],
      handler: (function (cxt, seqtype) {
        const f = cxt.feature
        const t = cxt.transcript
        const all = whichGene === 'all'
        const allT = whichTxp === 'all'
        const homologs = all ?
          this.dataManager().getHomologs(f, this.context.strips.map(
              s => s.genome)).filter(x => x)
          : [f]
        const seqs = u.flatten(homologs.map(ff => {
          if (seqtype === 'dna') {
            return this.dataManager().makeSequenceDescriptor(seqtype, ff)
          } else if (seqtype === 'composite transcript') {
            return this.dataManager().makeSequenceDescriptor(seqtype, ff, ff.composite)
          } else if (seqtype === 'transcript') {
            const txps = allT ? ff.transcripts : [t]
            return txps.map(tt => {
              return this.dataManager().makeSequenceDescriptor(seqtype, ff, tt)
            })
          } else if (seqtype === 'cds') {
            const cdss = allT ? ff.transcripts.filter(t => t.cds) : (t.cds ? [t] : [])
            return cdss.map(tt => {
              return this.dataManager().makeSequenceDescriptor(seqtype, ff, tt)
            })
          } else {
            u.fail('Unknown sequence type: ' + seqtype)
          }
        }))
        this.$root.ebus.emit('sequence-selected', { sequences : seqs, unselectAll : true })
      }).bind(thisObj)
    }
  }
  function sequenceCartOptions (whichGene, label, helpText) {
      const menuItems = []
      if (whichGene === 'target') {
        menuItems.push(sequenceSelectionOption('dna', 'target'))
        menuItems.push(sequenceSelectionOption('composite transcript', 'target', 'target'))
        menuItems.push(sequenceSelectionOption('transcript', 'target', 'target'))
        menuItems.push(sequenceSelectionOption('transcript','target','all'))
        menuItems.push(sequenceSelectionOption('cds', 'target', 'target'))
        menuItems.push(sequenceSelectionOption('cds','target','all'))
      } else {
        menuItems.push(sequenceSelectionOption('dna', 'all'))
        menuItems.push(sequenceSelectionOption('composite transcript', 'all', 'all'))
        menuItems.push(sequenceSelectionOption('transcript', 'all', 'all'))
        menuItems.push(sequenceSelectionOption('cds', 'all', 'all'))
      }
      return {
        label: label || '',
        helpText: helpText || '',
        menuItems: menuItems
      }
  }
  //
  const menu = [
    alignOption(),
    externalLinkOptions(),
    {
      label: 'Add sequences to cart...',
      icon: 'shopping_cart'
    },
    sequenceCartOptions('target', '...for this  gene only'),
    sequenceCartOptions('all', '...for this gene and all homologs')
  ]

  return {
    'default': menu
  }
}

export default getMenus
