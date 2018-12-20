import config from '@/config'
class FeatureColorMap {
  constructor () {
    this.cmap = config.FeatureColorMap.colors.reduce(
      (a, v) => { a[v.type] = v.color; return a },
      {})
  }
  // get the list of categorized types
  getTypes () {
    return config.FeatureColorMap.colors.map(c => c.type)
  }
  // get the list of colors corresponding to the categorized types
  getColors () {
    return config.FeatureColorMap.colors.map(c => c.color)
  }
  // Returns the categorized version of an input SO term
  getMungedType (t) {
    if (t.indexOf('gene') >= 0) {
      if (t.indexOf('pseudo') >= 0) {
        return 'pseudogene'
      } else if (t.indexOf('segment') >= 0) {
        return 'gene_segment'
      } else if (t.indexOf('RNA') >= 0) {
        return 'ncRNA_gene'
      } else if (t.indexOf('protein') >= 0) {
        return 'protein_coding_gene'
      } else {
        return 'other_gene'
      }
    } else if (t.indexOf('RNA') >= 0) {
      return 'ncRNA_gene'
    } else {
      return 'other_feature_type'
    }
  }
  // get color for so type or a feature with a sotype
  getColor (feat) {
    let sotype = typeof feat === 'string' ? feat : feat.sotype
    let mt = this.getMungedType(sotype)
    return this.cmap[mt]
  }
}

export default FeatureColorMap
