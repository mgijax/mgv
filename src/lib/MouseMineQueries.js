import { connections } from '@/lib/InterMineServices'

class MouseMineQueries {
  constructor () {
    this.cxn = connections.MouseMine
  }
  getQueries () {
    return [{
      name: 'Phenotype or disease',
      label: '...by phenotype or disease',
      placeholder: 'Pheno/disease (MP/DO) term or IDs',
      handler: (val) => this.queryByPhenoDisease(val)
    }, {
      name: 'Expression',
      label: '...by expression location',
      placeholder: 'Anatomy (EMAPA) terms or IDs',
      handler: (val) => this.queryByExpression(val)
    }, {
      name: 'Function',
      label: '...by cellular function',
      placeholder: 'Gene Ontology (GO) terms or IDs',
      handler: (val) => this.queryByFunction(val)
    }, {
      name: 'Pathway',
      label: '...by pathway',
      placeholder: 'Reactome pathways names, IDs',
      handler: (val) => this.queryByPathway(val)
    }, {
      name: 'Symbol/ID',
      label: '...by symbol/ID',
      placeholder: 'MGI names, synonyms, etc.',
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
    return this.cxn.query(q, r => r[0])
  }
  //
  queryByPathway (qryString) {
    qryString = this.addWildcards(qryString)
    const q = `<query name="" model="genomic"
        view="Gene.primaryIdentifier Gene.symbol" constraintLogic="A and B">
        <constraint path="Gene.pathways" code="A" op="LOOKUP" value="${qryString}"/>
        <constraint path="Gene.organism.taxonId" code="B" op="=" value="10090"/>
        </query>`
    return this.cxn.query(q, r => r[0])
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
    return this.cxn.query(q, r => r[0])
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
    return this.cxn.query(q, r => r[0])
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
