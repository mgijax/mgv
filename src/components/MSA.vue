<template>
  <div class="msa flexcolumn">
<form target="_blank" :action="`https://www.ebi.ac.uk/Tools/services/web_${tool}/toolform.ebi`" enctype="multipart/form-data" id="jd_toolSubmissionForm" method="post"> 
        <select id="tool" name="tool" v-model="tool" > 
          <option value="clustalo">Clustal Omega</option>
          <option value="muscle">MUSCLE</option>
          <option value="kalign">Kalign</option>
        </select>
        <input id="isSAM" type="hidden" value="m" /> 
        <div class="jd_toolParameterBox"> 
         <fieldset> 
          <legend>STEP 1 - Enter your input sequences</legend> 

          <p v-if="tool==='clustalo'"> <label for="sequence"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Clustal+Omega#ClustalOmega-sequence" target="_help">Enter or paste</a> </label> a set of <select id="stype" name="stype"> <option value="protein">PROTEIN</option> <option value="dna">DNA</option> <option value="rna">RNA</option> </select> sequences in any supported <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Clustal+Omega#ClustalOmega-sequence" target="_help">format</a>: </p>

          <p v-if="tool==='kalign'"> <label for="sequence"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Kalign#Kalign-sequence" target="_help">Enter or paste</a> </label> a set of <select id="stype" name="stype"> <option selected="selected" value="protein">Protein</option> <option value="dna">Nucleic Acid</option> </select> sequences in any supported <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Kalign#Kalign-sequence" target="_help">format</a>: </p>

          <p> <label for="sequence"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/MUSCLE#MUSCLE-sequence" target="_help">Enter or paste</a> </label> a set of sequences in any supported <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/MUSCLE#MUSCLE-sequence" target="_help">format</a>: </p> 
          <textarea v-model="sequences" cols="47" id="sequence" name="sequence" rows="7">
</textarea> 
          <p> Or <label for="upfile"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/MUSCLE#MUSCLE-upload" target="_help">upload</a> </label> a file: <input id="upfile" name="upfile" type="file" /> <label style="float: right; text-align: right;"> Use a <a href="#" id="exampleSeq">example sequence</a> | <a href="#" id="clearSequence">Clear sequence</a> | <a href="#" id="seeMoreExample">See more example inputs</a> </label> </p> 
         </fieldset> 
        </div> 
       

        <div v-if="tool === 'muscle'" class="jd_toolParameterBox"> 
         <fieldset> 
          <legend>STEP 2 - Set your Parameters</legend> 
          <div class="jd_singleLineParameter"> 
           <label for="format"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/MUSCLE#MUSCLE-format" target="_help">OUTPUT FORMAT:</a> </label> 
           <div> 
            <select id="format" name="format"> <option value="fasta">Pearson/FASTA</option> <option selected="selected" value="clw">ClustalW</option> <option value="clwstrict">ClustalW (strict)</option> <option value="html">HTML</option> <option value="msf">GCG MSF</option> <option value="phyi">Phylip interleaved</option> <option value="phys">Phylip sequential</option> </select> 
           </div> 
          </div> 
          <ul class="jd_parameterGroup collapsed"> 
           <li class="jd_parameterCell" style="width: 25%;"> <label for="tree"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/MUSCLE#MUSCLE-tree" target="_help">OUTPUT TREE</a> </label> 
            <div> 
             <select id="tree" name="tree"> <option selected="selected" value="none">none</option> <option value="tree1">From first iteration</option> <option value="tree2">From second iteration</option> </select> 
            </div> </li> 
           <!--<li class="jd_parameterCell" style="width: 24.9%;">--> 
           <!--<label for="order"><a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/MUSCLE#MUSCLE-order" target="_help">OUTPUT ORDER</a></label>--> 
           <!--<div>--> 
           <!--<select name="order" id="order">--> 
           <!--</select>--> 
           <!--</div>--> 
           <!--</li>--> 
          </ul> 
         </fieldset> 
        </div> 

        <div v-if="tool === 'clustalo'" class="jd_toolParameterBox"> 
         <fieldset> 
          <legend>STEP 2 - Set your parameters</legend> 
          <div class="jd_singleLineParameter"> 
           <label for="outfmt"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Clustal+Omega#ClustalOmega-outfmt" target="_help">OUTPUT FORMAT</a> </label> 
           <div> 
            <select id="outfmt" name="outfmt"> <option selected="selected" value="clustal_num">ClustalW with character counts</option> <option value="clustal">ClustalW</option> <option value="fa">Pearson/FASTA</option> <option value="msf">MSF</option> <option value="nexus">NEXUS</option> <option value="phylip">PHYLIP</option> <option value="selex">SELEX</option> <option value="stockholm">STOCKHOLM</option> <option value="vienna">VIENNA</option> </select> 
           </div> 
          </div> 
          <ul class="jd_parameterGroup collapsed"> 
           <li class="jd_parameterCell" style="width: 25%;"> <label for="dealign"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Clustal+Omega#ClustalOmega-dealign" target="_help">DEALIGN INPUT SEQUENCES</a> </label> 
            <div> 
             <select id="dealign" name="dealign"> <option selected="selected" value="false">no</option> <option value="true">yes</option> </select> 
            </div> </li> 
           <li class="jd_parameterCell" style="width: 25%;"> <label for="mbed"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Clustal+Omega#ClustalOmega-mbed" target="_help">MBED-LIKE CLUSTERING GUIDE-TREE</a> </label> 
            <div> 
             <select id="mbed" name="mbed"> <option selected="selected" value="true">yes</option> <option value="false">no</option> </select> 
            </div> </li> 
           <li class="jd_parameterCell" style="width: 24.9%;"> <label for="mbediteration"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Clustal+Omega#ClustalOmega-mbediteration" target="_help">MBED-LIKE CLUSTERING ITERATION</a> </label> 
            <div> 
             <select id="mbediteration" name="mbediteration"> <option selected="selected" value="true">yes</option> <option value="false">no</option> </select> 
            </div> </li> 
           <li class="jd_parameterCell" style="width: 25%;"> <label for="iterations"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Clustal+Omega#ClustalOmega-iterations" target="_help">NUMBER of COMBINED ITERATIONS</a> </label> 
            <div> 
             <select id="iterations" name="iterations"> <option selected="selected" value="0">default(0)</option> <option value="1">1</option> <option value="2">2</option> <option value="3">3</option> <option value="4">4</option> <option value="5">5</option> </select> 
            </div> </li> 
           <li class="jd_parameterCell" style="width: 25%;"> <label for="gtiterations"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Clustal+Omega#ClustalOmega-gtiterations" target="_help">MAX GUIDE TREE ITERATIONS</a> </label> 
            <div> 
             <select id="gtiterations" name="gtiterations"> <option selected="selected" value="-1">default</option> <option value="0">0</option> <option value="1">1</option> <option value="2">2</option> <option value="3">3</option> <option value="4">4</option> <option value="5">5</option> </select> 
            </div> </li> 
           <li class="jd_parameterCell" style="width: 25%;"> <label for="hmmiterations"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Clustal+Omega#ClustalOmega-hmmiterations" target="_help">MAX HMM ITERATIONS</a> </label> 
            <div> 
             <select id="hmmiterations" name="hmmiterations"> <option selected="selected" value="-1">default</option> <option value="0">0</option> <option value="1">1</option> <option value="2">2</option> <option value="3">3</option> <option value="4">4</option> <option value="5">5</option> </select> 
            </div> </li> 
           <li class="jd_parameterCell" style="width: 25%;"> <label for="order"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Clustal+Omega#ClustalOmega-order" target="_help">ORDER</a> </label> 
            <div> 
             <select id="order" name="order"> <option selected="selected" value="aligned">aligned</option> <option value="input">input</option> </select> 
            </div> </li> 
          </ul> 
         </fieldset> 
        </div> 

        <div v-if="tool === 'kalign'" class="jd_toolParameterBox"> 
         <fieldset> 
          <legend>STEP 2 - Set your Parameters</legend> 
          <div class="jd_singleLineParameter"> 
           <label for="format"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Kalign#Kalign-format" target="_help">OUTPUT FORMAT</a>:</label> 
           <div> 
            <select id="format" name="format"> <option value="fasta">Pearson/FASTA</option> <option selected="selected" value="clu">ClustalW</option> <option value="macsim">MACSIM</option> </select> 
           </div> 
          </div> 
          <ul class="jd_parameterGroup collapsed"> 
           <li class="jd_parameterCell" style="width: 24%; margin-right: 1%"> <label for="gapopen"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Kalign#Kalign-gapopen" target="_help">GAP OPEN PENALTY</a> </label> 
            <div> 
             <input id="gapopen" name="gapopen" type="text" value="11.0" /> 
            </div> </li> 
           <li class="jd_parameterCell" style="width: 24%; margin-right: 1%;"> <label for="gapext"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Kalign#Kalign-gapext" target="_help">GAP EXTENSION PENALTY</a> </label> 
            <div> 
             <input id="gapext" name="gapext" type="text" value="0.85" /> 
            </div> </li> 
           <li class="jd_parameterCell" style="width: 24%; margin-right: 1%;"> <label for="termgap"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Kalign#Kalign-termgap" target="_help">TERMINAL GAP PENALTIES</a> </label> 
            <div> 
             <input id="termgap" name="termgap" type="text" value="0.45" /> 
            </div> </li> 
           <li class="jd_parameterCell" style="width: 24.9%;"> <label for="bonus"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/Kalign#Kalign-bonus" target="_help">BONUS SCORE</a> </label> 
            <div> 
             <input id="bonus" name="bonus" type="text" value="0.0" /> 
            </div> </li> 
          </ul> 
         </fieldset> 
        </div> 

        <div class="jd_toolParameterBox"> 
         <fieldset> 
          <legend>STEP 3 - Submit your job</legend> 
          <div> 
           <label> <input class="checkbox" id="notification" name="notification" type="checkbox" />Be notified by email</label> 
           <em>(Tick this box if you want to be notified by email when the results are available)</em> 
          </div> 
          <div id="submission"> 
           <div class="line"> 
            <label for="email"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/MUSCLE#MUSCLE-email" target="_help">EMAIL:</a> </label> 
            <input class="textfield" id="email" name="email" size="100%" type="text" value="" /> 
           </div> 
           <div class="line"> 
            <label for="title"> <a href="https://www.ebi.ac.uk/seqdb/confluence/display/THD/MUSCLE#MUSCLE-title" target="_help">TITLE:</a> </label> 
            <input class="textfield" id="title" name="title" size="100%" type="text" value="" /> 
            <br />
            <em>If available, the title will be included in the subject of the notification email and can be used as a way to identify your analysis</em> 
           </div> 
          </div> 
          <div id="jd_submitButtonPanel"> 
           <input name="submit" type="submit" value="Submit" class="button" /> 
          </div> 
         </fieldset> 
        </div> 
       </form> 
   </div>
</template>

<script>
import MComponent from '@/components/MComponent'
export default MComponent({
  name: 'Msa',
  props: {
    sequences: String
  },
  data: function () {
    return {
      tool: 'muscle',
      tools: {
        muscle: {
          url: 'https://www.ebi.ac.uk/Tools/msa/kalign/../../services/web_muscle/toolform.ebi'
        },
        clustalo: {
        },
        kalign: {
        }
      }
    }
  },
  computed: {
    url: function () {
    }
  }
})
</script>

<style scoped>
</style>
