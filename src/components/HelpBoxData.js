
export default [{
    name: 'Overview',
    description: 'The Multiple Genome Viewer (MGV) allows you to browse and compare multiple related genomes, download corresponding sequence regions, display lists of genes, and several other functions.  For full details see: <a href="http://www.informatics.jax.org/userhelp/MGV_help.shtml" target="_blank">MGV help doc at MGI</a>',
    items: [
    ]
  }, {
    name: 'Genomes',
    description: 'MGV is designed to let you explore multiple genomes at once. Actions such as zooming, scrolling, and selecting genomic sequence may be applied to all displayed genomes at once, or only the one your mouse is in.',
    items: [{
      what: 'Add/remove genomes to the view',
      how: 'Open the "Genomes" dropdown list. Command-click the genomes you wish to add/remove.'
    }, {
      what: 'Switch modes',
      how: 'Click the lock icon. The current mode is indicated by either <i class="material-icons">lock</i> (synchronized) or <i class="material-icons">lock_open</i> (unsynchronized), and switches when you click it.'
      }, {
      what: 'Aligning displays',
      how: 'To center all the views around a gene (and turn on synched operation), alt-click on gene, or select "Align on this gene" from its popup menu, or search for the gene via the Find box.'
    }]
  }, {  
    name: 'Navigation',
    description: '',
    items: [{
      what: 'Find a gene',
      how: 'Enter the gene symbol or ID in the Find box. Then hit enter or tab.'
    }, {
      what: 'Specify coordinates',
      how: 'Type or paste coordinates in the Find box. Then hit enter or tab.'
    }, {
      what: 'Scroll left',
      how: 'Click the <i class="material-icons">chevron_left</i> button, or hit the <i class="material-icons">arrow_back</i> key, or drag left on a region.'
    }, {
      what: 'Scroll right',
      how: 'Click the <i class="material-icons">chevron_right</i> button, or hit the <i class="material-icons">arrow_forward</i> key, or drag right on a region.'
    }, {
      what: 'Zoom in',
      how: 'Click the <i class="material-icons">zoom_in</i> button, or hit the <i class="material-icons">arrow_upward</i> key, or shift-drag on a region.'
    }, {
      what: 'Zoom out',
      how: 'Click the <i class="material-icons">zoom_out</i> button, or hit the <i class="material-icons">arrow_downward</i> key, or command-drag on a region.'
    }]
  }, {
    name: 'Sequences',
    description: '',
    items: [{
      what: 'Download genomic sequences',
      how: 'Alt-drag the desired region. Then in the SequenceCart, enter a file name (if desired) and click the <i class="material-icons">cloud_download</i> button.'
      }, {
      what: 'Reverse complement',
      how: 'Genomic sequences in the SequenceCart are reverse complemented (or not) at the time of download, based on a toggle that is either <span>"CT"</span> (not reverse complemented) or "<div style="display:inline-block; transform:rotate(180deg);">AG</div>" (reverse complemented). Click this toggle to switch.'
      }, {
      what: 'Translate',
      how: 'CDS sequences in the SequenceCart are translated to amino acid sequences (or not) at the time of download, based on a toggle that is either <span>"ATG"</span> (not translated) or "M" (translated). Click this toggle to switch.'
      }, {
      what: 'Clear the SequenceCart',
      how: 'Click the checkmark at the bottom of the SequenceCart to select all sequences, then click the <i class="material-icons">delete</i> button.'
    }]
  }, {
    name: 'Lists',
    description: '',
    items: [
    ]
  }, {
    name: 'Settings',
    description: '',
    items: [
    ]
  }, {
    name: 'Shortcuts',
    description: 'Some common commands have keyboard shortcuts. NOTE: if MGV is unresponsive to key commands, try clicking in any displayed region.',
    items: [{
      what: 'h',
      how: 'Open/close this help window.'
    },{
      what: '<i class="material-icons">arrow_back</i>',
      how: 'Scroll left. Hold the shift key down to scroll left more.'
    },{
      what: '<i class="material-icons">arrow_forward</i>',
      how: 'Scroll right. Hold the shift key down to scroll right more.'
    },{
      what: '<i class="material-icons">arrow_upward</i>',
      how: 'Zoom in. Hold the shift key down to zoom in more.'
    },{
      what: '<i class="material-icons">arrow_downward</i>',
      how: 'Zoom out. Hold the shift key down to zoom out more.'
    },{
      what: 'l (ell)',
      how: 'Lock/unlock.'
    },{
      what: 't',
      how: 'Open/close the left-side tool panel.'
    },{
      what: 'x',
      how: 'Collapse/expand transcript display.'
    }]
}]
