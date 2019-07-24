<template>
  <div class="help-box">
    <!-- top part does not scroll -->
    <span class="title">MGV Cheatsheet</span>
    <div class="top-part">
      <!-- a button per section -->
      <span
        v-for="(s,i) in sections"
        class="sectionButton"
        :class="{ current: selectedSection === i }"
        @click="selectedSection = i"
        >{{s.name}}</span>
    </div>
    <!-- bottom part scrolls -->
    <div class="bottom-part" :class="currSection.name">
      <div
        v-if="currSection.description"
        v-html="currSection.description"
        />
      <table>
        <tr v-for="(r,ri) in currSection.items" class="itemrow">
          <td class="what">{{r.what}}</td>
          <td class="how" v-html="r.how"></td>
        </tr>
      </table>
    </div>
    <div class="footer">
      <input type="checkbox" v-model="app.$refs.settings.HelpBox.showOnStartup" />Show Help on startup.
    </div>

  </div>
</template>

<script>
import config from '@/config'
import MComponent from '@/components/MComponent'
export default MComponent({
    name: 'HelpBox',
    inject: ['preferencesManager'],
    data: function () {
      return {
        selectedSection: 0,
        sections: [{
          name: 'Overview',
          description: 'The Multiple Genome Viewer (MGV) allows you to browse and compare multiple related genomes, download corresponding sequence regions, display lists of genes, and several other functions.  For full details see: <a href="http://www.informatics.jax.org/userhelp/MGV_help.shtml" target="_blank">MGV help doc at MGI</a>',
          items: [
          ]
        }, {  
          name: 'Sync',
          description: 'Actions such as zooming, scrolling, and selecting genomic sequence may be applied to all displayed regions at once, or only to the region your mouse is in.',
          items: [{
            what: 'Switch modes',
            how: 'Click the lock icon. The current mode is indicated by either <i class="material-icons">lock</i> (synchronized) or <i class="material-icons">lock_open</i> (unsynchronized), and switches when you click it.'
            }, {
            what: 'Aligning displays',
            how: 'To center all the views around a gene (and turn on synched operation), alt-click on gene, or select "Align on this gene" from its popup menu, or search for the gene via the Find box.'
          }]
        }, {
          name: 'Genomes',
          description: 'MGV is designed to let you explore multiple genomes at once.',
          items: [{
            what: 'Add a genome to the view',
            how: 'Open the "Genomes" dropdown list. Command-click the genome you wish to add.'
          }, {
            what: 'Remove a genome from the view',
            how: 'Open the "Genomes" dropdown list. Command-click the genome you wish to add.'
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
            how: 'Click the <i class="material-icons">chevron_left</i> button, or hit the left-arrow key, or drag left on a region.'
          }, {
            what: 'Scroll right',
            how: 'Click the <i class="material-icons">chevron_right</i> button, or hit the right-arrow key, or drag right on a region.'
          }, {
            what: 'Zoom in',
            how: 'Click the <i class="material-icons">zoom_in</i> button, or hit the "+" key, or shift-drag on a region.'
          }, {
            what: 'Zoom out',
            how: 'Click the <i class="material-icons">zoom_out</i> button, or hit the "-" key, or command-drag on a region.'
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
          description: 'Many common commands have keyboard shortcuts.',
          items: [{
            what: 'left-arrow',
            how: 'Scroll left.'
          },{
            what: 'right-arrow',
            how: 'Scroll right.'
          },{
            what: '+',
            how: 'Zoom in.'
          },{
            what: '-',
            how: 'Zoom out.'
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
     }
   },
   computed: {
     currSection: function () {
       return this.sections[this.selectedSection]
     }
   },
   mounted: function () {
     this.preferencesManager().getPrefs('settings').then(settings => {
       if (settings.HelpBox.showOnStartup) {
         this.$parent.open()
       }
     })
   }
})

</script>

<style>
.help-box {
  width: 450px;
  text-align: left;
}
.help-box .title {
  font-size: 18px;
}
.help-box .top-part {
  padding-right: 50px;
}
.help-box .bottom-part {
  max-height: 500px;
  overflow: scroll;
}
.help-box td {
  padding-bottom: 10px;
}
.help-box .bottom-part.Shortcuts td {
  padding-bottom: 0px;
}
.help-box .what {
  font-weight: bold;
  vertical-align: top;
}
.help-box .bottom-part.Shortcuts .what {
  text-align: center;
}
.help-box .how .material-icons {
  font-size: 16px;
  font-weight: bold;
}
.help-box .sectionButton {
  cursor: pointer;
  border: thin solid black;
  border-radius: 4px;
  margin-right: 4px;
  margin-bottom: 4px;
  padding: 2px;
  display: inline-block;
}
.help-box .sectionButton:hover {
  background-color: white;
}
.help-box .sectionButton.current {
  background-color: #557f9e;
  color: white;
}
.help-box .footer {
  margin-top: 10px;
}
</style>
