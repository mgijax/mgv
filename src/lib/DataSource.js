//
//
import u from '@/lib/utils.js'
//
class DataSource {
  // Returns a promise for the list of available genomes, in preferred order
  // Each genome is an object with a name field. Additional fields may be present.
  //
  // [{ name }]
  //
  getGenomes () {
    u.fail('Override me.')
  }
  // Returns a promise for the list of chromosomes in the specified genome,
  // in preferred order. Each chromosome is an object with a name and a length. Additional fields may be present.
  //
  // [{ name, length }]
  //
  getChromosomes (g) {
    u.fail('Override me.')
  }
  // Returns a promise for the list of all top-level features on chromosome c of genome g.
  // Each feature is an object with the following fields (additional fields may be present):
  //
  // [{ ID, sotype, start, end, strand, cID, symbol }]
  //
  getFeatures (g, c) {
    u.fail('Override me.')
  }
  // Returns a promise for the models (transcripts+exons) of all features where the feature overlaps
  // the given region of the given genome. Each model has a list of transcripts. Each transcript is an object
  // having an ID, start and end coordinates, and a list of exons. Each exon is an object having start
  // and end coordinates.
  //
  // [{ ID, start, exons:[{ start, end }] }]
  //
  getModels (g, c, s, e) {
    u.fail('Override me.')
  }
  // Returns a promise for the genomic sequence from the specified slice.
  // The result is an object containing the original parameters and the sequence itself:
  //   { g, c, s, e, sequence }
  getSequence (g, c, s, e) {
    u.fail('Override me.')
  }
  // Returns a URL for downloading sequences of the specified type for the specified feature in Fasta format.
  // Args:
  //  f - the feature whose sequences you want
  //  type - which sequences. One of: genomic, transcript, cds, exon
  //  genomes - which genomes you want the sequences from
  getFastaUrl (f, type, genomes) {
    u.fail('Override me.')
  }
  // Returns a list of additional queries that the source knows how to run
  // These appear in the Find Genes box.
  // Returns a list of descriptors, each containing
  //    name: Name of this query. Used to help generate name for result lists.
  //    label: Label to show in the query selector
  //    placeholder: Placeholder text to display in the input box
  //    handler: Callback invoked when user enters a query term and tabs out or hits enter.
  getQueries () {
    u.fail('Override me.')
  }
}
//
export default DataSource
