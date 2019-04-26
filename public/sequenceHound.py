#!/usr/bin/python
#
# CGI for retrieving sequences in fasta format from multiple InterMine source and returniing
# the result in a single response. 
# Input is a list of descriptors, one per sequence.
# Response is a Fasta file.
#
# There are two ways to specify a sequence: as a slice of a chromosome, and as the sequence
# of a database object (like a CDS).
#
import sys
import urllib
import json
import string
import cgi
import cgitb
cgitb.enable()

def chunkString (s, n) :
  return [s[i:i+n] for i in range(0, len(s), n)]

def defaultHeader (desc) :
  desc['rc'] = 'reverse complement ' if desc['reverseComplement'] else ''
  desc['tr'] = 'translated ' if desc['translate'] else ''
  if 'chr' in desc:
    return '>%(genome)s::%(chr)s:%(start)d..%(end)d (%(rc)s%(tr)s%(type)s)' % desc
  else:
    return '>%(genome)s::%(ID)s (%(rc)s%(tr)s%(type)s)' % desc

def doOneSequence (desc) :
  fd = urllib.urlopen(desc['url'])
  data = fd.read()
  fd.close()
  if data.startswith(">") :
    seq = ''.join(data.split('\n', 1)[1].split())
  elif data.startswith("{") :
    obj = json.loads(data)
    seq = obj['features'][0]['seq']
  if desc['reverseComplement'] :
    seq = reverseComplement(seq)
  if desc['translate']:
    seq = translate(seq)
  seq = '\n'.join(chunkString(seq, 60))
  dfltHdr = defaultHeader(desc)
  hdr = desc.get('header', dfltHdr)
  if not hdr.startswith('>'):
    hdr = '>' + hdr
  return hdr + '\n' + seq + '\n'

def translate (rna) :
  rna = rna.upper().replace('T', 'U')
  codons = [ rna[i:i+3] for i in range(0, len(rna),3) ]
  residues = ''.join(map(lambda c: aaShort2Letter[genetic_code[c]], codons))
  return residues

def complement (dna) :
  return ''.join([base_complement.get(b, b) for b in dna])

def reverseComplement (dna) :
  return complement(dna)[::-1]

def doSequences (descs) :
  for d in descs:
    sys.stdout.write(doOneSequence(d))

def getParameters () :
  form = cgi.FieldStorage()
  params = {
    "descriptors" : None,
    "filename": "mgv.download.fa"
  }
  if "descriptors" in form:
      params["descriptors"] = json.loads(form["descriptors"].value)
  if "filename" in form:
      params["filename"] = form["filename"].value
  return params

def main () :
  params = getParameters()
  print 'Content-Type: text/x-fasta'
  print 'Content-Disposition: attachment; filename = "%s"' % params["filename"]
  print
  doSequences(params["descriptors"])

# --------------------------------------------------------
test = [{

"header": ">C3H/HeJ (dna) 1:8565944..8565966",
"reverseComplement": False,
"translate": False,
"url": "http://www.mousemine.org/mousemine/service/sequence?start=8565943&end=8565966&query=%3Cquery%20model%3D%22genomic%22%0A%20%20%20%20%20%20%20%20view%3D%22Chromosome.sequence.residues%22%3E%0A%20%20%20%20%20%20%20%20%3Cconstraint%20path%3D%22Chromosome.primaryIdentifier%22%20op%3D%22%3D%22%20value%3D%221%22%20%2F%3E%0A%20%20%20%20%20%20%20%20%3Cconstraint%20path%3D%22Chromosome.strain.name%22%20op%3D%22%3D%22%20value%3D%22C3H%2FHeJ%22%20%2F%3E%0A%20%20%20%20%20%20%3C%2Fquery%3E",

}, { 

"header": ">C3H/HeJ (reverse complement dna) 1:8565944..8565966",
"reverseComplement": True,
"translate": False,
"url": "http://www.mousemine.org/mousemine/service/sequence?start=8565943&end=8565966&query=%3Cquery%20model%3D%22genomic%22%0A%20%20%20%20%20%20%20%20view%3D%22Chromosome.sequence.residues%22%3E%0A%20%20%20%20%20%20%20%20%3Cconstraint%20path%3D%22Chromosome.primaryIdentifier%22%20op%3D%22%3D%22%20value%3D%221%22%20%2F%3E%0A%20%20%20%20%20%20%20%20%3Cconstraint%20path%3D%22Chromosome.strain.name%22%20op%3D%22%3D%22%20value%3D%22C3H%2FHeJ%22%20%2F%3E%0A%20%20%20%20%20%20%3C%2Fquery%3E",

}, { 

"header": ">C3H/HeJ (transcript) MGP_C3HHeJ_T0018681",
"reverseComplement": False,
"translate": False,
"url": "http://www.mousemine.org/mousemine/service/query/results/fasta?query=%3Cquery%20model%3D%22genomic%22%20view%3D%22Transcript.primaryIdentifier%22%3E%3Cconstraint%20path%3D%22Transcript.primaryIdentifier%22%20op%3D%22ONE%20OF%22%3E%3Cvalue%3EMGP_C3HHeJ_T0018681%3C%2Fvalue%3E%3C%2Fconstraint%3E%3C%2Fquery%3E&view=Transcript.gene.canonical.primaryIdentifier"

}, { 

"header": ">C3H/HeJ (cds) MGP_C3HHeJ_P0018680",
"reverseComplement": False,
"translate": False,
"url": "http://www.mousemine.org/mousemine/service/query/results/fasta?query=%3Cquery%20model%3D%22genomic%22%20view%3D%22CDS.primaryIdentifier%22%3E%3Cconstraint%20path%3D%22CDS.primaryIdentifier%22%20op%3D%22ONE%20OF%22%3E%3Cvalue%3EMGP_C3HHeJ_P0018680%3C%2Fvalue%3E%3C%2Fconstraint%3E%3C%2Fquery%3E&view=CDS.gene.canonical.primaryIdentifier"

}, { 

"header": ">C3H/HeJ (translated cds) MGP_C3HHeJ_P0018680",
"reverseComplement": False,
"translate": True,
"url": "http://www.mousemine.org/mousemine/service/query/results/fasta?query=%3Cquery%20model%3D%22genomic%22%20view%3D%22CDS.primaryIdentifier%22%3E%3Cconstraint%20path%3D%22CDS.primaryIdentifier%22%20op%3D%22ONE%20OF%22%3E%3Cvalue%3EMGP_C3HHeJ_P0018680%3C%2Fvalue%3E%3C%2Fconstraint%3E%3C%2Fquery%3E&view=CDS.gene.canonical.primaryIdentifier"

}]
base_complement = { 
  'a' : 't',
  't' : 'a',
  'c' : 'g',
  'g' : 'c',
  'n' : 'n',
  
  'A' : 'T',
  'T' : 'A',
  'C' : 'G',
  'G' : 'C',
  'N' : 'N' 
}

amino_acids_s = ''' 
  Alanine Ala     A   
  Arginine        Arg     R   
  Asparagine      Asn     N   
  Aspartate       Asp     D   
  Cysteine        Cys     C   
  Glutamate       Glu     E   
  Glutamine       Gln     Q   
  Glycine Gly     G   
  Histidine       His     H   
  Isoleucine      Ile     I   
  Leucine Leu     L   
  Lysine  Lys     K   
  Methionine      Met     M   
  Phenylalanine   Phe     F   
  Proline Pro     P   
  Selenocysteine  Sec     U   
  Serine  Ser     S   
  Threonine       Thr     T   
  Tryptophan      Trp     W   
  Tyrosine        Tyr     Y   
  Valine  Val     V   
  Stop      Stop    X   
'''

genetic_code_s = '''
  UUU     Phe
  UUC     Phe
  UUA     Leu
  UUG     Leu
  UCU     Ser
  UCC     Ser
  UCA     Ser
  UCG     Ser
  UAU     Tyr
  UAC     Tyr
  UAA     Stop
  UAG     Stop
  UGU     Cys
  UGC     Cys
  UGA     Stop
  UGG     Trp
  CUU     Leu
  CUC     Leu
  CUA     Leu
  CUG     Leu
  CCU     Pro
  CCC     Pro
  CCA     Pro
  CCG     Pro
  CAU     His
  CAC     His
  CAA     Gln
  CAG     Gln
  CGU     Arg
  CGC     Arg
  CGA     Arg
  CGG     Arg
  AUU     Ile
  AUC     Ile
  AUA     Ile
  AUG     Met
  ACU     Thr
  ACC     Thr
  ACA     Thr
  ACG     Thr
  AAU     Asn
  AAC     Asn
  AAA     Lys
  AAG     Lys
  AGU     Ser
  AGC     Ser
  AGA     Arg
  AGG     Arg
  GUU     Val
  GUC     Val
  GUA     Val
  GUG     Val
  GCU     Ala
  GCC     Ala
  GCA     Ala
  GCG     Ala
  GAU     Asp
  GAC     Asp
  GAA     Glu
  GAG     Glu
  GGU     Gly
  GGC     Gly
  GGA     Gly
  GGG     Gly
'''

amino_acids = map(lambda a: a.strip().split(), amino_acids_s.strip().split('\n'))
aaShort2Letter = dict([(r[1],r[2]) for r in amino_acids])
genetic_code_t = map(lambda c: c.strip().split(), genetic_code_s.strip().split('\n'))
genetic_code = dict([ (r[0],r[1]) for r in genetic_code_t ])
compTable = string.maketrans('actgACTG', 'tgacTGAC')

main()
