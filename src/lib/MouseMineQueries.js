import u from '@/lib/utils'

class MouseMineQueries {
  constructor () {
    this.qUrl = 'http://www.mousemine.org/mousemine/service/query/results?'
  }
  // Args:
  //   q - query in XML fomat
  //   mapper - (optional) function that maps each result into a desired form
  doQuery (q, mapper) {
    mapper = mapper || (x => x)
    let format = 'json'
    let query = encodeURIComponent(q)
    let url = this.qUrl + `format=${format}&query=${query}`
    return u.fetch(url, 'json').then(data => data.results.map(mapper))
  }
  getQueries () {
    return [{
      name: 'Phenotype or disease',
      label: 'Search by phenotype or disease',
      placeholder: 'Pheno/disease (MP/DO) term or IDs',
      helpText: 'Returns IDs of mouse genes associated with specified disease/phenotypes. Find terms/IDs for <a target="_blank" href="http://www.informatics.jax.org/vocab/mp_ontology/">phenotypes</a> and <a target="_blank" href="http://www.informatics.jax.org/disease">diseases</a>.',
      handler: (val) => this.queryByPhenoDisease(val)
    }, {
      name: 'Expression',
      label: 'Search by expression location',
      placeholder: 'Anatomy (EMAPA) terms or IDs',
      helpText: 'Returns IDs of mouse genes with expression results in the specified tissue or anatomical structure. Find terms/IDs for <a target="_blank" href="http://www.informatics.jax.org/vocab/gxd/anatomy/EMAPA:16039">mouse anatomy</a>.',
      handler: (val) => this.queryByExpression(val)
    }, {
      name: 'Function',
      label: 'Search by cellular function',
      placeholder: 'Gene Ontology (GO) terms or IDs',
      helpText: 'Returns IDs of genes associated with the specified cellular process, function, or location. Find GO terms/IDs for gene cellular <a target="_blank" href="http://www.informatics.jax.org/vocab/gene_ontology">function, process, and location.</a>.',
      handler: (val) => this.queryByFunction(val)
    }, {
      name: 'Symbol/ID',
      label: 'Search by symbol/ID',
      placeholder: 'MGI names, synonyms, etc.',
      helpText: '',
      handler: (val) => this.queryByLookup(val)
    }]
  }
  isIdentifier (q) {
    let pts = q.split(':')
    if (pts.length === 2 && pts[1].match(/^[0-9]+$/)) return true
    if (q.toLowerCase().startsWith('r-mmu-')) return true
    return false
  }
  //
  addWildcards (q) {
    return (this.isIdentifier(q) || q.indexOf('*') >= 0) ? q : `*${q}*`
  }
  //
  // do a LOOKUP query for Genes from MouseMine
  queryByLookup (qryString) {
    const q = `<query name="" model="genomic"
        view="Gene.primaryIdentifier Gene.symbol"
        constraintLogic="A and B and C">
            <constraint code="A" path="Gene" op="LOOKUP" value="${qryString}"/>
            <constraint code="B" path="Gene.organism.taxonId" op="=" value="10090"/>
            <constraint code="C" path="Gene.sequenceOntologyTerm.name" op="!=" value="transgene"/>
        </query>`
    return this.doQuery(q, r => r[0])
  }
  //
  queryByPathway (qryString) {
    qryString = this.addWildcards(qryString)
    const q = `<query name="" model="genomic"
        view="Gene.primaryIdentifier Gene.symbol" constraintLogic="A and B">
        <constraint path="Gene.pathways" code="A" op="LOOKUP" value="${qryString}"/>
        <constraint path="Gene.organism.taxonId" code="B" op="=" value="10090"/>
        </query>`
    return this.doQuery(q, r => r[0])
  }
  //
  queryByExpression (qryString) {
    qryString = this.addWildcards(qryString)
    const q = `<query model="genomic"
      view="GXDExpression.feature.primaryIdentifier"
      constraintLogic="A and (B or (C and D)) and E"
      >
      <constraint path="GXDExpression.structure.parents" code="A" op="LOOKUP" value="${qryString}" />
      <constraint path="GXDExpression.genotype.hasMutantAllele" code="B" op="=" value="false"/>
      <constraint path="GXDExpression.assayType" code="C" op="=" value="In situ reporter (knock in)"/>
      <constraint path="GXDExpression.genotype.zygosity" code="D" op="=" value="ht"/>
      <constraint path="GXDExpression.detected" code="E" op="=" value="true"/>
      </query>`
    return this.doQuery(q, r => r[0])
  }
  //
  queryByOntologyTerm (qryString, termTypes) {
    qryString = this.addWildcards(qryString)
    const q = `<query name="" model="genomic"
        view="Gene.primaryIdentifier Gene.symbol" constraintLogic="A and B and C and D">
        <constraint code="A" path="Gene.ontologyAnnotations.ontologyTerm.parents" op="LOOKUP" value="${qryString}"/>
        <constraint code="B" path="Gene.organism.taxonId" op="=" value="10090"/>
        <constraint code="C" path="Gene.sequenceOntologyTerm.name" op="!=" value="transgene"/>
        <constraint code="D" path="Gene.ontologyAnnotations.ontologyTerm.ontology.name" op="ONE OF">
            ${termTypes.map(tt => '<value>' + tt + '</value>').join('')}
        </constraint>
    </query>`
    return this.doQuery(q, r => r[0])
  }
  //
  queryByFunction (qryString) {
    return this.queryByOntologyTerm(qryString, ['Gene Ontology'])
  }
  queryByPhenoDisease (qryString) {
    return this.queryByOntologyTerm(qryString, ['Mammalian Phenotype', 'Disease Ontology'])
  }
}

export default MouseMineQueries
