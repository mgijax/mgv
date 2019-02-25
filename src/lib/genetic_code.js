//
const amino_acids_s = `
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
  Stop      Stop    *
`
//
const genetic_code_s = `
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
`
//
const amino_acids = amino_acids_s.trim().split('\n').map(s => s.trim().split(/ +/))
const aaShort2Letter = amino_acids.reduce((a,r) => { a[r[1]] = r[2]; return a }, {})
const genetic_code_t = genetic_code_s.trim().split('\n').map(s => s.trim().split(/ +/))
const genetic_code = genetic_code_t.reduce((a,r) => { a[r[0]] = r[1]; return a }, {})
//
function translate (rna) {
  const codons = rna.toUpperCase().replace(/T/g,'U').match(/.{1,3}/g);
  return codons.map(c => aaShort2Letter[genetic_code[c]]).join('')
}
//
export {
  translate
}
