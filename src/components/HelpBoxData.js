
function i(name) {
  return `<i class="material-icons">${name}</i>`
}

export default [{
    name: `Overview`,
    description: `The Multiple Genome Viewer (MGV) allows you to browse and compare multiple 
        related genomes, download corresponding sequence regions, display lists of genes, and 
        several other functions.  For full details see:
        <a href="http://www.informatics.jax.org/userhelp/MGV_help.shtml" target="_blank">MGV help doc at MGI</a>`,
    items: [
    ]
  }, {
    name: `Genomes`,
    description: `MGV is designed to let you explore multiple genomes at once. Actions such 
        as zooming, scrolling, and selecting genomic sequence may be applied to all displayed
        genomes at once, or only the one your mouse is in.`,
    items: [{
      what: `Add/remove genomes to the view`,
      how: `Open the "Genomes" dropdown list. Command-click the genomes you wish to add/remove.`
    }, {
      what: `Switch modes`,
      how: `Click the lock icon. The current mode is indicated by either ${i('lock')} 
          (synchronized) or ${i('lock_open')} (unsynchronized), and switches when you click it.`
      }, {
      what: `Aligning displays`,
      how: `To center all the views around a gene (and turn on synched operation), alt-click 
          on gene, or select "Align on this gene" from its popup menu, or search for the gene 
          via the Find box.`
    }]
  }, {  
    name: `Navigation`,
    description: ``,
    items: [{
      what: `Find a gene`,
      how: `Enter the gene symbol or ID in the Find box. Then hit enter or tab.`
    }, {
      what: `Specify coordinates`,
      how: `Type or paste coordinates in the Find box. Then hit enter or tab.`
    }, {
      what: `Scroll left`,
      how: `Click the ${i('chevron_left')} button, or 
            hit the ${i('arrow_back')} key, or drag left on a region.`
    }, {
      what: `Scroll right`,
      how: `Click the ${i('chevron_right')} button, or hit the 
          ${i('arrow_forward')} key, or drag right on a region.`
    }, {
      what: `Zoom in`,
      how: `Click the ${i('zoom_in')} button, or hit the ${i('arrow_upward')} 
          key, or shift-drag on a region.`
    }, {
      what: `Zoom out`,
      how: `Click the ${i('zoom_out')} button, or hit the ${i('arrow_downward')}
          key, or command-drag on a region.`
    }]
  }, {
    name: `Sequences`,
    description: ``,
    items: [{
      what: `Download genomic sequences`,
      how: `Alt-drag the desired region. Then in the SequenceCart, enter a file name (if desired) 
          and click the ${i('cloud_download')} button.`
      }, {
      what: `Reverse complement`,
      how: `Genomic sequences in the SequenceCart are reverse complemented (or not) at the time of 
          download, based on a toggle that is either <span>"CT"</span> (not reverse complemented) or
          "<div style="display:inline-block; transform:rotate(180deg);">AG</div>" (reverse complemented).
          Click this toggle to switch.`
      }, {
      what: `Translate`,
      how: `CDS sequences in the SequenceCart are translated to amino acid sequences (or not) at the
          time of download, based on a toggle that is either <span>"ATG"</span> (not translated) or "M"
          (translated). Click this toggle to switch.`
      }, {
      what: `Clear the SequenceCart`,
      how: `Click the checkmark at the bottom of the SequenceCart to select all sequences, then
          click the ${i('delete')} button.`
    }]
  }, {
    name: `Lists`,
    description: `You can create and display lists of genes. You can create lists by selecting specific
        genes, by entering a list of symbols or IDs, by specifying a disease, phenotype or other category,
        or by combining other lists. Your current lists are shown under MyLists.`,
    items: [{
      what: `Create by category`,
      how: `Under FindGenes, choose a category (eg "...by phenotype or disease"), enter a term
          (eg "Parkinson") and hit tab or enter. The results are shown as a new list entry under
          MyLists. This method of creating a list sends a query to MouseMine, so category definitions
          depend on its content.`
      }, {
      what: `Create from selection`,
      how: `In the ZoomView, you select genes by clicking on them. Hold the shift key to select more
          than one. Then, in MyLists. shift-click the "New" button.`
      }, {
      what: `Create by combining`,
      how: `Example: you have lists A and B and you want to create C containing the genes common to
          both. (1) Click "New" in MyLists. (2) Drag list A from MyLists onto the ListEditor items area.
          (3) Drag list B onto the set intersection area. Neighboring areas implement set union and set
          difference. You can also combine the current selection with a list by simply clicking on one
          of the set operators. Example: to add the current selection to a list, click the union area.` 
      }, {
      what: `Display a list`,
      how: `Click on the list in MyLists. The positions of all list items are shown in the GenomeView.
      In the ZoomView, any list items currently in view are highlighted. To stop displaying a list,
      click on it again. To step through the items in the list, shift-click the list repeatedly.`
      }, {
      what: `Edit a list`,
      how: `Click on the ${i('mode_edit')} button for the list to open the ListEditor. You can
          change the list's name, description, color, and items. Changes do not take effect until
          you click Create/Save.`
      }, {
      what: `Delete a list`,
      how: `Click on the ${i('highlight_off')} button for that list.`
    }]
  }, {
    name: `Display`,
    description: `There are numerous settings you can change to customize the display. At any point,
        you can also download the current display as a png or svg.`,
    items: [{
      what: `Download image`,
      how: `Click the ${i('camera_alt')} button in either the ZoomView or the GenomeView to download a
          png image of that area. Shift-click to download svg. Unlike a screen grab, this captures the
          entire display area even if it is scrolled out of view.`
    }]
  }, {
    name: `Shortcuts`,
    description: `Some common commands have keyboard shortcuts. NOTE: if MGV is unresponsive to key
        commands, try clicking in any displayed region.`,
    items: [{
      what: `h`,
      how: `Open/close this help window.`
    },{
      what: `l (ell)`,
      how: `Lock/unlock.`
    },{
      what: `t`,
      how: `Open/close the left-side tool panel.`
    },{
      what: `x`,
      how: `Collapse/expand transcript display.`
    },{
      what: `${i('arrow_back')}`,
      how: `Scroll left. Hold the shift key down to scroll left more.`
    },{
      what: `${i('arrow_forward')}`,
      how: `Scroll right. Hold the shift key down to scroll right more.`
    },{
      what: `${i('arrow_upward')}`,
      how: `Zoom in. Hold the shift key down to zoom in more.`
    },{
      what: `${i('arrow_downward')}`,
      how: `Zoom out. Hold the shift key down to zoom out more.`
    }]
}]
