// ---------------------------------------------------------------------
class InterMineConnection {
  // Args:
  //   utl - web service base URL
  constructor (url) {
    this.url = url
    this.qUrl = this.url + '/query/results?'
    this.seqSliceUrl = this.url + '/sequence?'
    this.faUrl = this.url + '/query/results/fasta?'
    this.fetchCount = 0
  }
  // Args:
  //   q - query in XML fomat
  //   mapper - (optional) function that maps each result into a desired form
  query (q, mapper) {
    mapper = mapper || (x => x)
    let format = 'json'
    let query = encodeURIComponent(q)
    let url = this.qUrl + `format=${format}&query=${query}`
    return u.fetch(url, 'json').then(data => data.results.map(mapper))
  }
  getSequenceSlice (q, start, end) {
    const url = this.seqSliceUrl + `start=${start - 1}&end=${end}&query=${encodeURIComponent(q)}`
    return u.fetch(url, 'json').then(data => data.features[0])
  }
}

export default InterMineConnection
