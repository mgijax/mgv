//
import DataSource from '@/lib/DataSource'
import u from '@/lib/utils'
class MouseMineDataSource extends DataSource {
  constructor (wsUrl) {
    super()
    this.wsUrl = wsUrl
    this.qUrl = this.wsUrl + '/query/results?'
    this.seqSliceUrl = this.wsUrl + '/sequence?'
    this.faUrl = this.wsUrl + '/query/results/fasta?'
    this.fetchCount = 0
  }
  fetch (url) {
    this.fetchCount += 1
    console.log('MouseMine: fetch count =', this.fetchCount)
    let p = fetch(url)
      .then(response => {
        if (response.status !== 200 && !response.bodyUsed) throw response
        return response.json()
      })
      .then(data => {
        if (data.error) throw data
        return data
      })
      .catch(err => {
        console.log('ERROR:', err)
      })
    return p
  }
  query (q, mapper) {
    mapper = mapper || (x => x)
    let format = 'json'
    let query = encodeURIComponent(q)
    let url = this.qUrl + `format=${format}&query=${query}`
    return this.fetch(url).then(data => data.results.map(mapper))
  }
  // [{ name }]
  getGenomes () {
    let q = `
      <query
        model="genomic"
        view="Strain.primaryIdentifier Strain.name Strain.organism.name Strain.attributeString"
        sortOrder="Strain.name ASC"
        >
        <constraint path="Strain" op="IN" value="Annotated strains" code="A" />
      </query>`
    let mapper = r => {
      return {
        ID: r[0],
        name: r[1],
        organism: r[2],
        attrString: r[3]
      }
    }
    return this.query(q, mapper)
  }
  // [{ name, length }]
  getChromosomes (g) {
    if (!g.name) u.fail('Bad argument')
    let q = `
      <query
        model="genomic"
        view="Chromosome.primaryIdentifier Chromosome.length"
        sortOrder="Chromosome.symbol asc"
        >
        <constraint path="Chromosome.strain.name" op="=" value="${g.name}"/>
      </query>`
    let mapper = r => {
      return {
        name: r[0],
        length: r[1]
      }
    }
    return this.query(q, mapper)
  }
  //
  getTranscriptIds (g, c) {
    let q = `<query
      model="genomic"
      view="Gene.primaryIdentifier Gene.transcripts.primaryIdentifier"
      sortOrder="Gene.primaryIdentifier asc"
      constraintLogic="A and B">
        <constraint path="Gene.strain.name" code="A" op="=" value="${g.name}"/>
        <constraint path="Gene.chromosome.primaryIdentifier" code="B" op="=" value="${c.name}"/>
      </query>`
    return this.query(q).then(rows => rows.reduce((rows2, row) => {
      let rlast = rows2[rows2.length - 1]
      if (rlast && row[0] === rlast[0]) {
        rlast[1].push(row[1])
      } else {
        rows2.push([row[0], [row[1]]])
      }
      return rows2
    }, [])).then(rows2 =>
      rows2.reduce((a, r) => { a[r[0]] = r[1].length; return a }, {})
    )
  }
  // [{ ID, sotype, chr, start, end, strand, cID, symbol }]
  getFeatures (g, c) {
    if (!g.name || !c.name) u.fail('Bad arguments')
    //
    let q = `
      <query
      model="genomic"
      view="Gene.primaryIdentifier Gene.chromosome.primaryIdentifier Gene.chromosomeLocation.start Gene.chromosomeLocation.end Gene.chromosomeLocation.strand Gene.sequenceOntologyTerm.name Gene.canonical.primaryIdentifier Gene.canonical.symbol"
      sortOrder="Gene.chromosomeLocation.start asc"
      >
       <join path="Gene.canonical" style="OUTER"/>
       <constraint path="Gene.strain.name" op="=" value="${g.name}"/>
       <constraint path="Gene.chromosome.primaryIdentifier" op="=" value="${c.name}"/>
      </query>`
    let mapper = r => {
      return {
        ID: r[0],
        chr: r[1],
        start: r[2],
        end: r[3],
        strand: r[4] === '-1' ? '-' : '+',
        sotype: r[5],
        cID: r[6],
        symbol: r[7],
        tCount: 0
      }
    }
    return this.query(q, mapper).then(feats => {
      // Add in the transcript count for each feature
      return this.getTranscriptIds(g, c).then(id2count => {
        feats.forEach(f => {
          f.tCount = id2count[f.ID] || 0
          f.transcripts = []
        })
        return feats
      })
    })
  }
  // [{ gID, transcripts:[{ tID, exons:[{ start, end }] }] }]
  getModels (g, c, s, e) {
    if (!g.name || !c.name || !s || !e) u.fail('Bad arguments')
    let q = `
    <query
    model="genomic"
    view="Exon.chromosomeLocation.start Exon.chromosomeLocation.end Exon.transcripts.primaryIdentifier Exon.transcripts.gene.primaryIdentifier"
    sortOrder="Exon.transcripts.gene.primaryIdentifier asc Exon.transcripts.primaryIdentifier asc Exon.chromosomeLocation.start asc"
    constraintLogic="A and B and C and D">
      <constraint path="Exon.transcripts.gene.chromosome.primaryIdentifier" code="A" op="=" value="${c.name}"/>
      <constraint path="Exon.transcripts.gene.chromosomeLocation.start" code="B" op="&lt;=" value="${e}"/>
      <constraint path="Exon.transcripts.gene.chromosomeLocation.end" code="C" op="&gt;=" value="${s}"/>
      <constraint path="Exon.strain.name" code="D" op="=" value="${g.name}"/>
    </query>
    `
    let mapper = r => {
      return {
        gID: r[3],
        tID: r[2],
        start: r[0],
        end: r[1]
      }
    }
    return this.query(q, mapper).then(models => models.reduce((mods, row) => {
      let lastm = mods[mods.length - 1]
      if (lastm && lastm.gID === row.gID) {
        let lastt = lastm.transcripts[lastm.transcripts.length - 1]
        if (lastt.tID === row.tID) {
          lastt.exons.push({ start: row.start, end: row.end })
        } else {
          lastm.transcripts.push({ tID: row.tID, exons: [{ start: row.start, end: row.end }] })
        }
      } else {
        mods.push({ gID: row.gID, transcripts: [{ tID: row.tID, exons: [{ start: row.start, end: row.end }] }] })
      }
      return mods
    }, [])).then(mods => {
      // sort each gene's transcripts by number of exons
      mods.forEach(mod => {
        mod.transcripts.sort((a, b) => b.exons.length - a.exons.length)
      })
      return mods
    })
  }
  // { g, c, s, e, sequence }
  getSequence (g, c, s, e) {
    if (!g.name || !c.name || !s || !e) u.fail('Bad arguments')
    let q = `
      <query model="genomic"
        view="Chromosome.sequence.residues">
        <constraint path="Chromosome.primaryIdentifier" op="=" value="${c.name}" />
        <constraint path="Chromosome.strain.name" op="=" value="${g.name}" />
      </query>`
    let query = encodeURIComponent(q)
    let url = this.seqSliceUrl + `start=${s - 1}&end=${e}&query=${query}`
    console.log(url)
    return this.fetch(url).then(data => data.features[0])
  }
  //
  getQueries () {
    return [{
      name: 'Phenotype or disease',
      label: '...by phenotype or disease',
      placeholder: 'Pheno/disease (MP/DO) term or IDs',
      handler: (val) => this.queryByPhenoDisease(val)
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
  // do a LOOKUP query for SequenceFeatures from MouseMine
  queryByLookup (qryString) {
    let q = `<query name="" model="genomic"
        view="SequenceFeature.primaryIdentifier SequenceFeature.symbol"
        constraintLogic="A and B and C">
            <constraint code="A" path="SequenceFeature" op="LOOKUP" value="${qryString}"/>
            <constraint code="B" path="SequenceFeature.organism.taxonId" op="=" value="10090"/>
            <constraint code="C" path="SequenceFeature.sequenceOntologyTerm.name" op="!=" value="transgene"/>
        </query>`
    return this.query(q, r => r[0])
  }
  //
  queryByPathway (qryString) {
    qryString = this.addWildcards(qryString)
    let q = `<query name="" model="genomic"
        view="Gene.primaryIdentifier Gene.symbol" constraintLogic="A and B">
        <constraint path="Gene.pathways" code="A" op="LOOKUP" value="${qryString}"/>
        <constraint path="Gene.organism.taxonId" code="B" op="=" value="10090"/>
        </query>`
    return this.query(q, r => r[0])
  }
  //
  queryByOntologyTerm (qryString, termTypes) {
    qryString = this.addWildcards(qryString)
    let q = `<query name="" model="genomic"
        view="SequenceFeature.primaryIdentifier SequenceFeature.symbol" constraintLogic="A and B and C and D">
        <constraint code="A" path="SequenceFeature.ontologyAnnotations.ontologyTerm.parents" op="LOOKUP" value="${qryString}"/>
        <constraint code="B" path="SequenceFeature.organism.taxonId" op="=" value="10090"/>
        <constraint code="C" path="SequenceFeature.sequenceOntologyTerm.name" op="!=" value="transgene"/>
        <constraint code="D" path="SequenceFeature.ontologyAnnotations.ontologyTerm.ontology.name" op="ONE OF">
            ${termTypes.map(tt => '<value>' + tt + '</value>').join('')}
        </constraint>
    </query>`
    return this.query(q, r => r[0])
  }
  //
  queryByFunction (qryString) {
    return this.queryByOntologyTerm(qryString, ['Gene Ontology'])
  }
  queryByPhenoDisease (qryString) {
    return this.queryByOntologyTerm(qryString, ['Mammalian Phenotype', 'Disease Ontology'])
  }
  // Returns a URL for downloading sequences of the specified type for the specified feature in Fasta format.
  // Args:
  //  f - the feature whose sequences you want
  //  type - which sequences. One of: genomic, transcript, cds, exon
  //  genomes - which genomes you want the sequences from
  getFastaUrl (f, type, genomes) {
    let q
    let url
    let view
    let ident
    //
    type = type ? type.toLowerCase() : 'genomic'
    //
    if (f.cID) {
      ident = f.cID
      //
      let gs = ''
      let vals
      if (genomes) {
        vals = genomes.map((g) => `<value>${g.name}</value>`).join('')
      }
      switch (type) {
        case 'genomic':
          view = 'Gene.canonical.primaryIdentifier'
          gs = `<constraint path="Gene.strain.name" op="ONE OF">${vals}</constraint>`
          q = `<query name="sequencesByCanonicalId" model="genomic" view="Gene.primaryIdentifier" >
            <constraint path="Gene.canonical.primaryIdentifier" op="=" value="${ident}"/>
            ${gs}</query>`
          break

        case 'transcript':
          view = 'Transcript.gene.canonical.primaryIdentifier'
          gs = `<constraint path="Transcript.strain.name" op="ONE OF">${vals}</constraint>`
          q = `<query name="transcriptSequencesByCanonicalId" model="genomic" view="Transcript.primaryIdentifier" >
            <constraint path="Transcript.gene.canonical.primaryIdentifier" op="=" value="${ident}"/>
            ${gs}</query>`
          break

        case 'exon':
          view = 'Exon.gene.canonical.primaryIdentifier'
          gs = `<constraint path="Exon.strain.name" op="ONE OF">${vals}</constraint>`
          q = `<query name="exonSequencesByCanonicalId" model="genomic" view="Exon.primaryIdentifier" >
            <constraint path="Exon.gene.canonical.primaryIdentifier" op="=" value="${ident}"/>
            ${gs}</query>`
          break
        case 'cds':
          view = 'CDS.gene.canonical.primaryIdentifier'
          gs = `<constraint path="CDS.strain.name" op="ONE OF">${vals}</constraint>`
          q = `<query name="cdsSequencesByCanonicalId" model="genomic" view="CDS.primaryIdentifier" >
            <constraint path="CDS.gene.canonical.primaryIdentifier" op="=" value="${ident}"/>
            ${gs}</query>`
          break
      }
    } else {
      ident = f.ID
      view = ''
      switch (type) {
        case 'genomic':
          q = `<query name="sequencesById" model="genomic" view="Gene.primaryIdentifier" >
            <constraint path="Gene.primaryIdentifier" op="=" value="${ident}"/>
          </query>`
          break
        case 'transcript':
          q = `<query name="transcriptSequencesById" model="genomic" view="Transcript.primaryIdentifier" >
            <constraint path="Transcript.gene.primaryIdentifier" op="=" value="${ident}"/>
          </query>`
          break
        case 'exon':
          q = `<query name="exonSequencesById" model="genomic" view="Exon.primaryIdentifier" >
            <constraint path="Exon.gene.primaryIdentifier" op="=" value="${ident}"/>
          </query>`
          break
        case 'cds':
          q = `<query name="cdsSequencesById" model="genomic" view="CDS.primaryIdentifier" >
            <constraint path="CDS.gene.primaryIdentifier" op="=" value="${ident}"/>
          </query>`
          break
      }
    }
    if (!q) return null
    url = this.faUrl + `query=${encodeURIComponent(q)}`
    if (view) url += `&view=${encodeURIComponent(view)}`
    return url
  }
}
export default MouseMineDataSource
