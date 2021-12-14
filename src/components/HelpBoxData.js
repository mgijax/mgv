
function i(iname, color) {
  color = color || 'black'
  return iname ? `<i class="material-icons" style="color: ${color};">${iname}</i>` : ''
}

function ref(name) {
  return `<b>${name}</b>`
}

export default [{
    name: `About`,
    description: `The Multiple Genome Viewer (MGV) allows you to browse and compare multiple 
        related genomes, download corresponding sequence regions, display lists of genes, and 
        other functions.
        <p/>
        To open/close this Help at any time, click the ${i('help')} button in the page header, or type 'H'.
        This popup provides basic help.
        For more details see:
        <a href="http://www.informatics.jax.org/userhelp/MGV_help.shtml" target="_blank">MGV help doc at MGI</a>
        <p/>
        Help is also available from MGI User Support via <a href="mailto:mgi-help@jax.org">email</a>, online 
        <a href="http://www.informatics.jax.org/mgihome/support/mgi_inbox.shtml" target="_blank">form</a>, 
        or phone (207-288-6445).
        <p/>
        MGV has been tested on MacOS 10.15.6 (Catalina) with these browsers:
        Chrome
        version 85, Safari version 14, and FireFox version 79.
        `,
    items: []
  }, {
    name: `Quick Start`,
    description: ``,
    items: [{
      heading: 'Four basic examples'
    }, {
      label: `View a gene and its homologs`,
      text: `
          Example: view the structure of Pax6 in C57BL/6J (GRCm39), CAROLI/EiJ, and H.sapiens.
          <ol>
          <li> Select the three genomes. <li> Type Pax6 into to the "Find" box and hit return.</ol>
          <a href="#regions=C57BL/6J%20(GRCm39)::2:105469726..105558270/1267|CAROLI/EiJ::2:99105820..99194363/1267|H.%20sapiens::11:31759222..31847765/1267&highlight=MGI:97490&lock=on&paralogs=off&style=gg:40,tg:6,fd:3,fl:1,ff:10,fh:10,tx:0,pl:1,tc:0,h:1,ho:0.05,hi:1,hc:0">See result</a>.
          Alternative: for any gene currently being displayed, option-click on it.
          `
      }, {
      label: `View two or more gene and their homologs`,
      text: `
          Example: view the structure of Pax2, Pax4, and Pax6 in C57BL/6J (GRCm39), CAROLI/EiJ, and H.sapiens.
          <ol>
          <li> Select the three genomes. <li> Type "Pax2 Pax4 Pax6" into to the "Find" box and hit return.</ol>
          <a href="#regions=C57BL/6J%20(GRCm39)::2:105469726..105558270/419,6:28435313..28456372/419,19:44643371..44918377/419|CAROLI/EiJ::2:99107492..99192691/419,6:23288530..23308959/419,19:41335411..41583105/419|H.%20sapiens::7:127602441..127625993/419,10:100640847..100924493/419,11:31760090..31846897/419&highlight=MGI:97486,HGNC:8616,MGI:97488,HGNC:8618,MGI:97490,HGNC:8620&lock=on&paralogs=off&style=gg:40,tg:6,fd:3,fl:1,ff:10,fh:10,tx:0,pl:1,tc:0,h:1,ho:0.05,hi:1,hc:0">See result</a>.
          Alternative: shift-option-click on multiple genes
          `
      }, {
      label: `View a reference region and related regions.
        `,
      text: `Example: view the region 3:18511623..20827190 in C57BL/6J (GRCm39) (this is 1.5 Mb around Trim55) and the corresponding regions in human.
        <ol><li> Select the two genomes. Be sure C57BL/6J is on top. <li> Copy/paste the coordinates into the Find box and hit return.
        <a href="#regions=C57BL/6J%20(GRCm39)::3:19127787..20615286/1267|H.%20sapiens::3:148697871..149222008/601,8:65602458..66178464/660&ref=C57BL/6J%20(GRCm39)&paralogs=off&style=gg:40,tg:6,fd:3,fl:1,ff:10,fh:10,tx:0,pl:1,tc:0,h:1,ho:0.05,hi:1,hc:0">See result</a>.
        </ol>
        Alternatively, you can get to approximately the same view by first typing "Trim55" into the Find box and hit return
        (as in the previous example). Then click the "R" in the left endcap of the C57BL/6J strip, and zoom out.
        `
      }, {
      label: `Download CDS sequences for a gene and its homologs`,
      text: `
        Here is <a href="#regions=C3H/HeJ::2:150884516..150896797/1267|DBA/2J::2:145423704..145435976/1267|A/J::2:146162540..146174821/1267|C57BL/6J%20(GRCm39)::2:147880704..147892982/1267&highlight=MGI:1347476&lock=on&paralogs=off&style=gg:40,tg:6,fd:3,fl:1,ff:10,fh:10,tx:1,pl:1,tc:0,h:1,ho:0.05,hi:1,hc:0">Foxa2</a> for several mouse genomes.
        <ol>
        <li> Right-click on Foxa2 in any of the genomes. A popup menu appears.
        <li> Mouse over "Add sequences to cart ... for this gene and all homologs" and select "All cds sequences".
        Fourteen entries are added to the Sequence Cart, and they are all selected.
        <li> In the Sequence Cart download area, enter a file name and click the download button. You can also view the sequences in the browser or copy them into the clipboard (so you can paste them elsewhere.
        </ol>
        `
      }, {
      label: `Download arbitrary genomic regions`,
      text: `
        Here is a region centered around the <a href="#regions=DBA/2J::X:160254828..160309777/1267|A/J::X:161374688..161428799/1267|C57BL/6J%20(GRCm39)::X:162896892..162950591/1267&highlight=MGI:1917258&lock=on&paralogs=off&style=gg:40,tg:6,fd:3,fl:1,ff:10,fh:10,tx:1,pl:1,tc:0,h:1,ho:0.05,hi:1,hc:0">proximal end of Ace2</a> in three mouse genomes. We want to download the genomic region containing the first two exons from all three genomes. Note the the lock icon is ON.
        <ol>
        <li> Hold down the option (or alt) key while dragging left-to-right over the desired region. Three sequences are added to the Sequence Cart.
        <li> In the Sequence Cart download area, enter a file name and click the download button.
        </ol>
        `
      }, {
      heading: `Tips`
      }, {
      label: 'Use the back button',
      text: `Using the browser's back undoes most actions.
        `
      }, {
      label: 'Refresh the page',
      text: `If the viewer gets into a weird state, try refreshing the page.
        `
      }, {
      label: 'Tooltips',
      text: `Most controls have tooltips that appear when you hover the mouse over them.
        `
      }, {
      label: 'Select only',
      text: `
        Shift-clicking a checkbox in a list of checkboxes selects ONLY that item; everything else is unselected.
        `
      }, {
      label: 'Cancel drag',
      text: `Can cancel an in-progress drag operation by hitting the ESC key.
        `
      }]
  }, {
    name: `Genomes`,
    description: `MGV lets you explore multiple regions from multiple genomes at once.
        Each region is a mini-browser, and regions can be controlled individually or in sync.
        `,
    items: [{
      label: `Add genomes to the view`,
      text: `The ${ref('Genomes')} box lists all the genomes.
          Check the box next to a genome to add it to the ${ref('ZoomView')};
          uncheck the box to remove it.
          To see metadata for a genome, hover the mouse over the genome's name.
          To select one genome and remove all others, shift-click the box.
          Buttons at the bottom of the list provide ways to
          select predefined sets of genomes.
          `
      }, {
      label: `Rearranging genomes`,
      text: `
          In the ${ref('ZoomView')}, genomes are displayed as horizontal "strips".
          Strips can be reordered by dragging;
          grab the center handle (<span style="font-weight: bold;">::</span>) in the left endcap 
          and drag up or down.
          You can also sort the genomes alphabetically by clicking the ${i('sort')} icon in the control area.
          (NOTE that if there is a reference genome, it is always positioned at the top.)
          `
      }, {
      label: `Reference genome`,
      text: `You can optionally pick a genome to be the "reference" by clicking the "R" in that genome's end cap.
          <ul><li>The corresponding strip rises to the top, and its left end cap has a different color.
          <li>All other genome regions are calculated based on the reference and are updated with every change in the reference region.
          <li>The reference genome always stays at the top of the view; other genomes may still be rearranged.
          <li>The reference genome is always displayed; you cannot turn off its checkox (in ${ref('Genomes')}) while it is the reference.
          <li>To "turn off" the reference genome, click its "R" again.
          <li>Use the R key to turn on/off the reference genome.
          </ul>
          `
      }, {
      label: `Metadata`,
      text: `
          Information such as the genome build number is displayed when you mouse over a
          genome's name in the ${ref('Genomes')} box. 
          `
      }]
  }, {
    name: `Regions`,
    description: `
        `,
    items: [{
      label: `Add regions to the view`,
      text: `Adding a genome creates a new region.
          To add another region for the same genome, shift-drag on a chromosome in the GenomeView.
          Alternatively, split an existing region, then navigate one side to the desired location.
          To navigate a single region, control-click its background, then use the dialog box.
          `
      }, {
      label: `Aligning regions around a gene`,
      text: `To center all displayed genomes around a gene and its homologs (and turn on ${i('lock')}), 
          alt-click (option-click) 
          on the gene, or select "Align on this gene" from the gene's context menu, or search for the gene 
          via the Find box. If the gene has paralogs, they are/are not included in this operation depending whether 
          the paralogs toggle ("P") is on or off, respectively.
          `
      }, {
      label: `Region controls`,
      text: `To access controls for an individual region within a genome,
          right-click on its background (not on a feature).
          Changes made here affect only that region.
          `
      }, {
      label: `Splitting a region`,
      text: `You can create a new region for a genome by splitting an existing one. To split a region, alt-click on
          its background (not on a feature). Alternatively, click the ${i('compare')} button in the region's popup controls.
          `
      }, {
      label: `Joining regions`,
      text: `You can join two neighboring regions by alt-clicking on the divider bar between them.
          Both regions must be from the same chromosome.
          `
      }, {
      label: `Reverse orientation`,
      text: `By default, the forward strand direction is drawn left-to-right.
          When comparing regions with inversions, it can be convenient to draw some 
          left-to-right and some right-to-left, so that homologs line up vertically.
          To reverse the orientation of a region, open its controls and click on the "F-R" toggle.
          To reverse the orientation of all the regions in a strip, click the &gt; in the left endcap.
          The icon turns into <span style="color: red;">&lt;</span>.
          Click again to revert to normal.
          Regions in reverse orientation are outlined in red.
          `
      }, {
      label: `Moving and resizing regions`,
      text: `
          Multiple regions for a genome are displayed side-by-side in a strip.
          Regions can be reordered by dragging; grab the handle (::)
          at the top left corner of a region to move it left or right.
          Genome regions can be resized by dragging the gray divider bar between
          neighboring regions.
          `
    }]
  }, {
    name: `Homologs`,
    description: `
      MGV uses homology relationships between genes to draw connections, to calculate what regions to display, 
      and other stuff. MGV distinguishes three kinds of homology relationships:
      <ol>
      <li>Orthologs. Homology assertions between genes of different species come from the 
      Alliance of Genome Resources (stringent set).
      <li>(Inferred) paralogs. Homology assertions between different genes in the same species are inferred
      from common orthology. Inference of paralogs depends on the set of species you are currently viewing and is 
      calculated on the fly. You can control whether or not inferred paralogs are used by
      clicking the <span style="color: rgb(255, 127, 14); font-weight: bold;">P</span> icon in the control area next to the Find box.
      <li>Genologs. Assertions of gene equivalence across genomes within a species
      is accomplished by shared canonical identifiers, e.g., MGI IDs for the annotated inbred strains.
      </ol>
       `,
    items: [{
      label: `Connections`,
      text: `MGV draws connections between equivalent genes in neighboring strips when you mouse over or click on them. When the strips are from different species, connections are drawn from a gene to all orthologs in the view. When the strips are from the same species (e.g. different mouse strains), connections are drawn from a gene to the same gene only (P off), or to the same gene and all its paralogs (P on). Note that connections are only drawn between features that are already in view. To be certain you are seeing all paralogs, you should align on that gene (see below).
      If a genome does <u>not</u> have a homolog to a gene that is highlighted, a warning message is displayed.
      Similarly, a warning is displayed if a genome <u>does</u> have a homolog that is currently not in view.
      `
    }, {
      label: `Align on a gene`,
      text: `Alt-click (or option-click) on a gene. Determines regions to draw based on equivalence to the clicked feature. In a different species, regions include all orthologs. In the same species, regions include the same gene only (P off) or that gene and its paralogs (P on).
      If a genome does not have a homolog of the clicked gene, a warning message is displayed and the the genome shows nothing.
      `
    }, {
      label: `Searching`,
      text: `Enter a gene's symbol or ID in the Find box. Essentially does a lookup followed by an alignment. See Align on a gene.`,
    }, {
      label: `Picking sequences`,
      text: `When you open a feature's menu (right-click or control-click on the feature), there are options to add various sequences to your sequence cart. The options under 'This gene and all homologs' are sensitive to whether P is on or off.
        `,
    }]
  }, {  
    name: `Modes`,
    description: `MGV has three modes which determine how the displayed regions are calculated and how actions synchronize (or not).
      `,
    items: [{
      label: `Reference`,
      text: `
       <span style="color: white; background-color: rgb(255, 127, 14); width: 16px;">&nbsp;R&nbsp;</span> 
       One genome is chosen as the reference. The regions displayed for all other genomes depend on the reference, 
       such that all homologs of all genes in the reference region(s) are displayed.
       Navigating in the reference genome causes all other genomes to update. To 
       make a genome the reference, click on the R in its left end cap. Alternativelty, typing 'R' makes the 
       genome at the top of the display the reference. Clicking or typing R again turns off reference mode.
       Finally, entering coordinates in the Find box automatically makes the top genome the reference.
      `
    }, {
      label: `Lockstep`,
      text: `
      <i class="material-icons" style="color: rgb(255, 127, 14); font-size: 20px;">lock</i> In lockstep mode, all displayed regions act as one. Zooming, scrolling, and selecting genomic sequence happen in all regions simultaneously. This mode is most useful when the regions are aligned around a landmark, such as when the user alt-clicks (aka option-click) on a gene. Clicking the lock icon or typing 'L' toggles lockstep mode on/off.
      `
    }, {
      label: `Unrestricted`,
      text: `
      <span style="color: rgb(68,68,68); background-color: rgb(204,204,204); width: 16px;">&nbsp;R&nbsp;</span> <i class="material-icons" style="color: black; font-size: 20px;">lock_open</i> When both Reference and Lockstep are off, each region acts independently, i.e., scrolling/zooming a region affects only that region.
      `
    }]

  }, {  
    name: `Navigation`,
    description: ``,
    items: [{
      label: `Jump to a gene`,
      text: `Enter the gene symbol or ID in the Find box at the top of
      the ${ref('ZoomView')}. Then hit enter or tab. Lines up the view on that gene.
      You can enter multiple symbols/IDs separated by commas and/or spaces to align view the around multiple genes.
      `
    }, {
      label: `Line up on a gene`,
      text: `
        You can option-click (alt-click) on a gene to align the view around that gene or its homologs in all genomes.
        Hold down the command/meta key (or not) to scale the region sizes.
        Scaling can help when the homologs are of very different sizes.
        If a genome does not have a homolog of the clicked gene, a warning message is displayed and the genome displays nothing.
            `
    }, {
      label: `Specify coordinates`,
      text: `Type or paste coordinates in the Find box. Use the format chr:start..end, e.g., "2:105641053..105726252". Then hit enter or tab. The coordinates apply to the top displayed genome, which also becomes the reference; other genomes' coordinates are then derived.
            `
    }, {
      label: `Scroll`,
      text: `
          Scroll by dragging on a region or by using a mouse wheel or trackpad.
          There are also scroll buttons (${i('chevron_left')} and  ${i('chevron_right')},
          or you may use the arrow keys (${i('arrow_back')} and ${i('arrow_forward')}).
          Holding the shift key down while clicking or typing increases the scroll amount.
          `
    }, {
      label: `Zoom`,
      text: `
          Zoom by shift-dragging (for zoom in) or command-dragging (for zoom out) over part of a region. 
          For zooming in, the dragged region expands to fill the view, and for zooming out, the current 
          view shrinks to fill the dragged area.
          <br/>
          You can do centered zooming by clicking the ${i('zoom_in')} and ${i('zoom_out')} buttons, or by
          hitting the ${i('arrow_upward')} and ${i('arrow_downward')} keys.
          Holding the shift key down while clicking or typing increases the zoom amount.
          `
    }]
  }, {
    name: `Filters`,
    description: `Filters provide a way to limit the features that are drawn in the ${ref('ZoomView')}.
       `,
    items: [{
      heading: "General notes"
    }, {
      label: `Alert icons`,
      text: `
       When a filter is "on", ${i('warning', 'rgb(255, 127, 14)')} is shown in the ${ref('ZoomView')} header to remind
       you of that fact.  You can click on this icon to turn off all filters.
       The same icon is displayed on each filter that is currently active; click these icons to turn off individual filters.
	  `
    }, {
      label: `True/False filters`,
      text: `A true/false filter includes/excludes a given feature based on whether it meets some 
          condition or not. These filters have a third option, "Don't care", which essentially
	  turns off the test.
	  `
    }, {  
      label: `Multi-select filters`,
      text: `A multiselect filter offers a set of choices, of which any number may be checked.
          A feature is included or excluded based on whether a specific attribute is among the checked items or not.
          Checking all items in a multi-select is equivalent to "Don't care" and effectively turns off the test.
          Shift-clicking on a selection is a shortcut for selecting that item and unselecting everything else.
	  `
    }, {  
      heading: "Specific filters"
    }, {  
      label: `Feature type`,
      text: `Only displays features of the selected type(s).
	  `
    }, {  
      label: `Feature length`,
      text: `Only displays features whose lengths fall in the selected range(s).
          `
    }, {  
      label: `Missing from some* genome`,
      text: `If true, only displays features that are missing in at least one of the currently displayed genomes.
            If false, only displays features that are present in all currently displayed genomes.
          `
    }, {  
      label: `Is in current list`,
      text: `If there is no current list, this filter has no effect.
          Otherwise: if true, only displays features that are members of the current list;
          if false, only displays features that are not members of the current list.
          `
    }, {  
      label: `Is currently selected`,
      text: `If no features are currently selected, this filter has no effect.
          Otherwise: if true, only displays currently selected features.
          if false, only displays features that are not currently selected.
          Setting the filter to true provides a way to focus on one gene at a time: click on a gene, and it 
          becomes the only displayed gene, then click the background to see everything again.
         `
    }]
  }, {
    name: `Sequences`,
    description: `You can select sequences and download them in FASTA format, view them in the browser, or copy them to the clipboard.
        The ${ref('SequenceCart')} contains (descriptors of) sequences that you select plus
        controls for downloading. Actual sequences are not materialized until download
        time, so the SequenceCart itself takes little space. If you want whole chromosomes, though,
        you should go to <a href="ftp://ftp.ensembl.org/pub/" target="_blank">Ensembl</a>.
        `,
    items: [{
      label: `Select genomic sequences`,
      text: `You can add the genomic sequence of all currently displayed regions to the SequenceCart by clicking the ${i('shopping_cart')} icon in the main control area. You can add genomic sequence for a single region by opening that region's menu (right click on region background) and clicking the ${i('shopping_cart')} icon.
          <br /><br />
          You can also specify genomic sequences to download using the mouse.
          Alt-drag over the desired range to add it to the ${ref('SequenceCart')}.
          If ${i('lock','rgb(255, 127, 14)')} is set, the selection happens in all displayed regions.
          If the drag action is right-to-left, the sequence(s) will be reverse-complemented. 
          `
      }, {
      label: `Select gene model sequences`,
      text: `Right click on a gene to open its context menu. Choose one of the 
          options under "Add sequences to cart." You can select genomic, transcript,
          composite transcript, or CDS sequences; you may select these sequences the current gene only or for that
          gene and its homologs. A composite transcript consists of the union of all the
          exons of all the transcripts of a gene; these are what you see when "Show transcripts" is off,
          and all transcripts for a gene are piled on top of one another.
          `
      }, {
      label: `Download sequences`,
      text: `In the ${ref('SequenceCart')}, select the sequences you want to download by clicking
          their checkboxes in the SequenceCart.
          When sequences are selected, download buttons are enabled.
          To download to a file, enter a file names and click the ${i('cloud_download')} next to "File".
          To view the sequences in a browser tab, click the ${i('cloud_download')} next to "Browser".
          And to load the sequences into the clipboard (so you can paste them somewhere), click the
          ${i('cloud_download')} next to "Clipboard", then click the ${i('check_circle','green')} to confirm (this
          extra step is required by web security restrictions).
          `
      }, {
      label: `Reverse complement`,
      text: `Genomic sequences in the ${ref('SequenceCart')} are reverse complemented (or not) at the time of 
          download, based on a toggle that is either <span>"CT"</span> (not reverse complemented) or
          "<div style="display:inline-block; transform:rotate(180deg);">AG</div>" (reverse complemented).
          Click this toggle to switch.`
      }, {
      label: `Translate`,
      text: `CDS sequences in the ${ref('SequenceCart')} are translated to amino acid sequences (or not) at the
          time of download, based on a toggle that is either <span>"ATG"</span> (not translated) or "M"
          (translated). Click this toggle to switch.`
      }, {
      label: `Clear the ${ref('SequenceCart')}`,
      text: `Click the ${i('check_box')} at the bottom of the ${ref('SequenceCart')} to select all sequences, then
          click the ${i('delete','red')} button.`
    }]
  }, {
    name: `Gene lists`,
    description: `You can create and display lists of genes (actually, gene IDs).
        Your current lists plus controls for creating new lists are
        available under ${ref('Gene lists')}. You can create lists by selecting specific
        genes, by entering a list of symbols or IDs, or by searching a disease, phenotype or other category.
        `,
    items: [{
      label: `Create from MouseMine search`,
      text: `Under Create, choose a category (e.g. "Search by phenotype or disease"), enter a term
          (e.g. "Parkinson") and click the "GO" button. Links to appropriate browsers are displayed for each category to
          assist in finding appropriate search terms/IDs. The results are shown as a new list entry.
          If your category term returned no or unexpected results, check 
          <a href="https://www.mousemine.org/" target="_blank">MouseMine</a> for term usage.
          <span style="color: red;">Note that lists created by searching MouseMine are limited to mouse only.</span>
          `
      }, {
      label: `Create from selection`,
      text: `In the ${ref('ZoomView')}, you select genes by clicking on them. Hold the shift key to select more
          than one. Then, under Create, select "New list from ZoomView selection" and click the "GO" button.
          The new list is given a default name and color, which you can change.
	  `
      }, {
      label: `Display a list`,
      text: `Click on the list under MyLists. The positions of all list items (up to a max size) are shown
      in the ${ref('GenomeView')}.
      In the ${ref('ZoomView')}, any list items currently in view are highlighted.
      As well, the list name appears in the ZoomView control area.
      To stop displaying a list, click on it again under MyLists, or click the ${i('highlight_off','red')}
      in the control area.
          `
      }, {
      label: `Step through a list`,
      text: `Shift-click on a list to make it the current list and jump to the first gene.
          Continue to shift-click to jump to successive list items.
          `
      }, {
      label: `Edit a list`,
      text: `Click on the ${i('mode_edit')} button for the list to open the ${ref('ListEditor')}. You can
          change the list's name, description, color, and items. Changes do not take effect until
          you click Create/Save.`
      }, {
      label: `Delete a list`,
      text: `Click on the ${i('highlight_off')} button for that list.`
    }]
  }, {
    name: `Page layout`,
    description: ``,
    items: [{
      label: `Page Layout`,
      text: `The page is divided into two columns of boxes.
          The left column, which contains various tools, can be hidden or shown
          by typing "t" (for "tools"), or by clicking the ${i('settings')} button
          in the header.
          The right column, containing various views, is always visible.
          Each box can be opened/closed by clicking the "X" in its top right corner.
          (Shift-click the "X" to open that box and close others in its column.)
          Boxes can be repositioned vertically in their columns by dragging the grab
          handle (${i('drag_indicator')}) in the box's top right corner.
          `
    }, {
      label: `Views`,
      text: `
      The two main sections of the page are the ${ref('ZoomView')},
          which shows specified chromosomal regions from one or more genomes, and the
          ${ref('GenomeView')}, which shows all the chromosomes of a single genome.
          The two views are synchronized. E.g., clicking on a strip in ${ref('ZoomView')}
          refocuses ${ref('GenomeView')} to display that genome.
          `
    }, {
      label: `Genomes and Regions`,
      text: `In the ${ref('ZoomView')}, each genomic region is displayed in its own "mini browser" 
          that can be scrolled and zoomed. The size of a region
          ranges from a full chromosome to a few bases.
          <p/>
          Regions shown in the ${ref('GenomeView')} and ${ref('ZoomView')} for a given
          genome correspond, and changes in one are reflected in the other.
          Clicking in a genome region in the ${ref('ZoomView')} highlights the
          corresponding region in the ${ref('GenomeView')}, and vice versa.
          `
    }]
  }, {
    name: `Settings`,
    description: `Under ${ref('Settings')} are numerous parameters you can change to customize the display. At any point,
        you can also download the current display as a png or svg (click the ${i('camera_alt')} icon).`,
    items: [{
      heading: `Sizes`
    }, {
      label: `Genome gap`,
      text: `Changes the amount of space separating the genomes (horizontal strips).`
    }, {
      label: `Transcript gap`,
      text: `Changes the amount of space separating the transcripts within a gene.`
    }, {
      label: `Font size`,
      text: `Sets the size of the font used for gene and transcript labels.`
    }, {
      label: `Exon thickness`,
      text: `Sets the height of the rectangles used to draw features.`
    }, {
      heading: `Features`
    }, {
      label: `Show all feature labels`,
      text: `When checked and view region is below the details threshold, displays labels for all 
          visible genes and transcripts. When unchecked or when view region is above the threshold, labels are
          displayed only for highlighted genes. Keyboard shortcut: N.
          `
    }, {
      label: `Details threshold`,
      text: `When the view region is below this size, the details of gene model structure become visible. 
          Above this size, genes are simply drawn as boxes. Higher values use more memory.
          `
    }, {
      label: `Expand to show transcripts`,
      text: `
          When view width is below the Details threshold, transcript structure becomes visible.
          This selector controls which genes are "expanded" so that all transcripts are visible.
          Same as using the 'X' keyboard shortcut.
          `
    }, {
      label: `Show protein labels`,
      text: `When checked, the label for a displayed CDS is its protein ID. Otherwise, the transcript ID.`
    }, {
      label: `Show start/stop codons`,
      text: `When checked, marks the positions of start and stop codons with blue and red triangles, respectively.
          `
    }, {
      label: `Contrast`,
      text: `Fades non-selected features to make the selected feature stand out.
          `
    }, {
      heading: `Homology Connections`
    }, {
      label: `Infer paralogs`,
      text: `Same as clicking the P icon in the view area. Controls whether paralogs are (on) or are not (off) included in region calculations, connector drawing, etc.
      `
    }, {
      label: `Show connectors`,
      text: `When checked, connectors are drawn joining highlighted genes across genomes.`
    }, {
      label: `Highlight inversions`,
      text: `If on, connectors between features on opposite strands ('inversions') in red and with a twist.
      `
    }, {
      label: `Fill opacity`,
      text: `Sets the opacity of the connector fill area.`
    }, {
      heading: `Misc`
    }, {
      label: `Track mouse`,
      text: `When checked, a positional indicator follows your mouse when it is over a region.`
    }, {
      label: `Clear cache and reload`,
      text: `MGV caches data on your computer for performance. Clicking this button allows you to 
          clear the cache and reload the page. This action asks for confirmation before proceeding.
          `
    }, {
      label: `Purge and exit`,
      text: `Click to remove all MGV data from your computer and leave the site.
          This action asks for confirmation before proceeding.
          `
    }]
  }, {
    name: `Key commands`,
    description: `Some commands have keyboard shortcuts. If MGV seems unresponsive to key
        commands, try clicking in any displayed region. Note that you do not need to hold the shift key
        down when typing these commands.
        `,
    items: [{
      label: `H`,
      text: `Open/close this help window. Same as clicking ${i('info')} in the page header.`
    },{
      label: `L`,
      text: `Turns lock on
          (${i('lock','rgb(255, 127, 14)')}) or off (${i('lock_open')}).
          Same as clicking the lock icon.
          NOTE: when lock is turned on, the reference genome (if any) is de-selected.
          `
    },{
      label: `N`,
      text: `Show/don't show all feature labels. Same as clicking "Show all feature labels" under Settings.`
    },{
      label: `P`,
      text: `Include/exclude paralogs. Same as clicking the P icon.`
    },{
      label: `R`,
      text: `Turn reference genome on/off. The top genome in the view is made the reference. Same as clicking the R in the genome's left end cap. NOTE: when ref genome is selected, the lock is turned off.`
    },{
      label: `S`,
      text: `Creates a new list from the currently selected features. Holding down the shift key includes homologs.
        `
    },{
      label: `T`,
      text: `Open/close the left-side tool panel. Same as clicking the ${i('settings')} in the page header.`
    },{
      label: `X`,
      text: `Cycle through the values (none/selected/all) specifying which genes are "expanded" to show transcripts. Same as 'Expand to show transcripts' under Settings.`
    },{
      heading: `The following shortcuts use the arrow keys.`
    },{
      label: `${i('arrow_back')}`,
      text: `Scroll left. Hold the shift key down to scroll left more.`
    },{
      label: `${i('arrow_forward')}`,
      text: `Scroll right. Hold the shift key down to scroll right more.`
    },{
      label: `${i('arrow_upward')}`,
      text: `Zoom in. Hold the shift key down to zoom in more.`
    },{
      label: `${i('arrow_downward')}`,
      text: `Zoom out. Hold the shift key down to zoom out more.`
    }]
  }, {
    name: `Mouse commands`,
    description: `Here is a quick summary of mouse actions you can perform in the ZoomView.
        NOTE that when the scroll lock is on (${i('lock','rgb(255, 127, 14)')}), drag actions apply to all current regions.
        `,
    items: [{
        label: 'Click a feature',
        text: `Selects the feature. Hold down the shift key (shift-click) to select multiple features.`
    },{
        label: `Click the background`,
        text: `Unselects all features.`
    },{
        label: `Control-click a feature`,
        text: `Opens context menu for the feature. Linkouts, download options, etc.`
    },{
        label: `Option-click a feature`,
        text: `Centers the view around that feature and its homologs. Holding down the command key (option-command-click) scales the regions in a way that is useful when homologs are of very different sizes.`
    },{
        label: `Control-click on background`,
        text: `Opens context menu for that region. Controls to split/remove region, reverse orientation, etc.`
    },{
        label: `Drag`,
        text: `Scrolls the view. You can also use a trackpad or mouse wheel or the arrow keys.`
    },{
        label: `Shift-drag`,
        text: `Zooms into that region. Dragged region fills view.`
    },{
        label: `Command-shift-drag`,
        text: `Zooms out. Current view shrinks to fill dragged region.`
    },{
        label: `Option-drag`,
        text: `Adds selected genomic sequence to sequence cart. If drag direction is right-to-left, sequence is reverse complemented.`
    },{
        label: `Option-click on background`,
        text: `Splits the region at that point into two independently scrollable regions.`
    },{
        label: `Option-click on divider bar`,
        text: `Joins the two regions on either side of the bar.`
    }]
}]
