// ---------------------------------------------------------------------
// Abstract superclass for anything that reads track data.
// Each reader is associated with a single genome.
// The fundamental call is to fetch data within a chromosomal range.
class TrackReader {
  // Args:
  //   name - track name
  //   cfg - reader config
  //   genome - genome descriptor
  constructor (name, cfg, genome) {
    this.name = name
    this.cfg = cfg
    this.genome = genome
    this.url = cfg.url || genome.url
  }
  // Returns a promise for all the features in the track.
  readAll () {
    /* override me */
  }
  // Returns a promise for all features in the track on the given chromosome.
  readChromosome (c) {
    /* override me */
  }
  // Returns a promise for data overlapping the specified range.
  // Args:
  //   c - chromosome descriptor
  //   s - start coordinate
  //   e - end coordinate
  readRange (c, s, e) {
    /* override me */
  }
}
// ---------------------------------------------------------------------
// Abstract superclass for readers that return genome features.
class FeatureTrackReader extends TrackReader {
}
// ---------------------------------------------------------------------
// Abstract superclass for readers that return sequences (genomic or otherwise).
class SequenceTrackReader extends TrackReader {
}

export { FeatureTrackReader, SequenceTrackReader }
