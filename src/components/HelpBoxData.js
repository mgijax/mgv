
function i(iname) {
  return iname ? `<i class="material-icons">${iname}</i>` : ''
}

function ref(name) {
  return `<b>${name}</b>`
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
      how: `Click the lock icon.
          <table>
          <tr>
            <td>${i('lock_open')}</td>
            <td>Unsynchronized. Each displayed region scrolls and zooms independently.</td>
          </tr>
          <tr>
            <td>${i('lock')}</td>
            <td>Synchronized. All regions scroll and zoom in sync.</td>
          </tr>
          </table>
          `
      }, {
      what: `Aligning displays`,
      how: `To center all the views around a gene (and turn on ${i('lock')}), alt-click 
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
    description: `You can select sequences and download them in FASTA format. 
        The ${ref('SequenceCart')} contains (descriptors of) sequences that you select plus
        controls for downloading. Actual sequences are not materialized until download
        time, so large(-ish) sequences are ok. If you want whole chromosomes, though,
        you should go to <a href="ftp://ftp.ensembl.org/pub/" target="_blank">Ensembl</a>.
        `,
    items: [{
      what: `Select genomic sequences`,
      how: `Alt-drag the desired region; it is added to the ${ref('SequenceCart')}.
          If ${i('lock')} is set, the selection happens in all displayed regions.
          If the drag action is right-to-left, the sequence(s) will be reverse-complemented. 
          `
      }, {
      what: `Select gene sequences`,
      how: `Right click on a gene to open its context menu. Choose one of the 
          options under "Add sequences to cart". You can select genomic, transcript, or CDS
          sequences, for the current gene or for that gene and its genologs.
          `
      }, {
      what: `Download sequences`,
      how: `In the ${ref('SequenceCart')}, select the sequences you want to download. Fill in a file name (optional). Then click the ${i('cloud_download')} button.`
      }, {
      what: `Reverse complement`,
      how: `Genomic sequences in the ${ref('SequenceCart')} are reverse complemented (or not) at the time of 
          download, based on a toggle that is either <span>"CT"</span> (not reverse complemented) or
          "<div style="display:inline-block; transform:rotate(180deg);">AG</div>" (reverse complemented).
          Click this toggle to switch.`
      }, {
      what: `Translate`,
      how: `CDS sequences in the ${ref('SequenceCart')} are translated to amino acid sequences (or not) at the
          time of download, based on a toggle that is either <span>"ATG"</span> (not translated) or "M"
          (translated). Click this toggle to switch.`
      }, {
      what: `Clear the ${ref('SequenceCart')}`,
      how: `Click the checkmark at the bottom of the ${ref('SequenceCart')} to select all sequences, then
          click the ${i('delete')} button.`
    }]
  }, {
    name: `Lists`,
    description: `You can create and display lists of genes. You can create lists by selecting specific
        genes, by entering a list of symbols or IDs, by specifying a disease, phenotype or other category,
        or by combining other lists. Your current lists are shown under ${ref('MyLists')}.`,
    items: [{
      what: `Create by category`,
      how: `Under ${ref('Find Genes')}, choose a category (eg "...by phenotype or disease"), enter a term
          (eg "Parkinson") and hit tab or enter. The results are shown as a new list entry under
          ${ref('MyLists')}. This method of creating a list sends a query to MouseMine, so category definitions
          depend on its content.`
      }, {
      what: `Create from selection`,
      how: `In the ${ref('ZoomView')}, you select genes by clicking on them. Hold the shift key to select more
          than one. Then, in ${ref('MyLists')}. shift-click the "New" button.`
      }, {
      what: `Create by combining`,
      how: `Example: you have lists A and B and you want to create C containing the genes common to
          both. (1) Click "New" in ${ref('MyLists')}. (2) Drag list A from ${ref('MyLists')} onto the ${ref('ListEditor')} items area.
          (3) Drag list B onto the set intersection area. Neighboring areas implement set union and set
          difference. You can also combine the current selection with a list by simply clicking on one
          of the set operators. Example: to add the current selection to a list, click the union area.` 
      }, {
      what: `Display a list`,
      how: `Click on the list in ${ref('MyLists')}. The positions of all list items are shown in the ${ref('GenomeView')}.
      In the ${ref('ZoomView')}, any list items currently in view are highlighted. To stop displaying a list,
      click on it again. To step through the items in the list, shift-click the list repeatedly.`
      }, {
      what: `Edit a list`,
      how: `Click on the ${i('mode_edit')} button for the list to open the ${ref('ListEditor')}. You can
          change the list's name, description, color, and items. Changes do not take effect until
          you click Create/Save.`
      }, {
      what: `Delete a list`,
      how: `Click on the ${i('highlight_off')} button for that list.`
    }]
  }, {
    name: `Settings`,
    description: `Under ${ref('Settings')} are numerous parameters you can change to customize the display. At any point,
        you can also download the current display as a png or svg.`,
    items: [{
      what: `Download image`,
      how: `Click the ${i('camera_alt')} button in either the ${ref('ZoomView')} or the ${ref('GenomeView')} to download a
          png image of that area. Shift-click to download svg. Unlike a screen grab, this captures the
          entire display area even if it is scrolled out of view.`
    }, {
      heading: `Features`
    }, {
      what: `Details threshold`,
      how: `When the view region is below this size, the details of gene model structure become visible. 
          Above this size, genes are simply drawn as boxes. Higher values use more memory.
          `
    }, {
      what: `Show all labels`,
      how: `When checked and view region is below the details threshold, displays labels for all 
          visible genes. When unchecked or when view region is above the threshold, labels are
          displayed only for highlighted genes.
          `
    }, {
      what: `Font size`,
      how: `Sets the size of the font used for gene labels.`
    }, {
      what: `Height`,
      how: `Sets the height of the rectangles used to draw features.`
    }, {
      what: `Lane gap`,
      how: `Sets the vertical distance between overlapping genes.`
    }, {
      heading: `Transcripts. Note that transcripts are only visible when the view region 
          size is below the detials threshild.
          `
    }, {
      what: `Spread transcripts`,
      how: `When checked, transcripts for a gene are spread out so they are all visible. 
          When unchecked, transcripts are drawn on top of one another for a compact view.
          Same as using the 'x' keyboard shortcut.
          `
    }, {
      what: `Show all labels`,
      how: `When checked, and transcripts are spread, displays labels for all visible transcripts. 
          Not recommended unless you're pretty far zoomed in.
          `
    }, {
      what: `Font size`,
      how: `Sets the size of the font for transcript labels.`
    }, {
      what: `Show start/stop codons`,
      how: `When checked, marks the positions of start and stop codons. Start codons are blue triangles 
          pointing in the direction of transcription. Stop codons are red triangled pointing down.
          `
    }, {
      heading: `Sequences. When zoomed in far enough (less than a few hundred bases), the genomic 
          sequence is displayed.
          `
    }, {
      what: `Font size`,
      how: `Size of the font used to draw the sequence letters.`
    }, {
      heading: `Selections. These options affect highlighting.`
    }, {
      what: `Contrast`,
      how: `Increasing the contrast makes selected genes stand out more by fading unselected genes.
          `
    }, {
      what: `Show connectors`,
      how: `When checked, connectors join highlighted genes across genomes.`
    }, {
      what: `Fill opacity`,
      how: `Sets the opacity of the connector fill area.`
    }, {
      heading: `Misc`
    }, {
      what: `Track mouse`,
      how: `When checked, a positional indicator follows your mouse when it is over a region.`
    }, {
      what: `Clear cache and reload`,
      how: `MGV caches data on your computer for performance. Clicking this button allows you to 
          clear the cache and reload the page.
          `
    }]
  }, {
    name: `Shortcuts`,
    description: `Some common commands have keyboard shortcuts. If MGV seems unresponsive to key
        commands, try clicking in any displayed region.`,
    items: [{
      what: `h`,
      how: `Open/close this help window. Same as clicking ${i('info')}.`
    },{
      what: `l (ell)`,
      how: `Same as clicking the lock icon. Flips synchronization mode between synchronized (${i('lock')}) and not synchronized (${i('lock_open')}).`
    },{
      what: `t`,
      how: `Open/close the left-side tool panel.`
    },{
      what: `x`,
      how: `Collapse/expand transcript display.`
    },{
      heading: `The following shortcuts use the arrow keys.`
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
