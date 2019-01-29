//
import { SequenceTrackReader } from '@/lib/TrackReader'
// ---------------------------------------------------------------------
// Implementation for sequence readers that read from an Intermine instance.
class InterMineSequenceReader extends SequenceTrackReader {
  constructor(name, cfg, genome) {
    super(name, cfg, genome)
    this.mine = new InterMineConnection(this.url)
  }
  readRange (chr, start, end) {
    return this.mine.getChromosomeSlice(this.genome, chr, start, end)
  }
}
// ---------------------------------------------------------------------
// Implementation of a sequence reader the gets genomic sequences from MouseMine.
class MouseMineSequenceReader extends InterMineSequenceReader {
  constructor(name, cfg, genome) {
    super(name, cfg, genome)
    this.mine = new MouseMineConnection(this.url)
  }
}

export { InterMineSequenceReader, MouseMineSequenceReader }
