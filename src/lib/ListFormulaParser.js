/*
    start ::=
        expr
        |
        ;
    expr ::=
        term exprTail
        ;
    exprTail ::=
        [ "+" | "-" ] expr
        |
        ;
    term ::=
       factor termTail
       ;
    termTail ::=
       "*" term
       |
       ;
    factor ::=
       "(" expr ")"
       |
       "[" idList "]"
       |
       STRING
       |
       "?" STRING
       |
       ID
       ;
    idList ::=
       ID idList
       |
       ;
*/
const PLUS = "+"
const MINUS = "-"
const STAR = "*"
const EMPTY = ""
const QUEST = "?"
const DQUOTE = '"'
const EQUALS = "="
const LPAREN = "("
const RPAREN = ")"
const LSB = "["
const RSB = "]"
const LCB = "{"
const RCB = "}"

// ---------------------------------------------
// Parses a list operator expression, eg "(a + b)*c - d"
// Returns an abstract syntax tree.
//     Leaf nodes = list names. They are simple strings.
//     Interior nodes = operations. They look like: {left:node, op:string, right:node}
// 
class ListFormulaParser {
    constructor () {
        this.r_ops   = /[?()+*-]/
        this.r_ident = /[a-zA-Z_][a-zA-Z0-9_]*/
        this.r_qstr  = /"[^"]*"/
        this.re = new RegExp(`(${this.r_ops.source}|${this.r_qstr.source}|${this.r_ident.source})`, 'g')
        //this.re = /([()+*-]|"[^"]+"|[a-zA-Z_][a-zA-Z0-9_]*)/g
        this._init(EMPTY)
    }
    _init (s) {
        this.expr = s
        this.tokens = this.expr.match(this.re) || []
        this.i = 0
    }
    _peekToken() {
        return this.tokens[this.i]
    }
    _nextToken () {
        let t
        if (this.i < this.tokens.length) {
            t = this.tokens[this.i]
            this.i += 1
        }
        return t
    }
    _expr () {
        let node = this._term()
        let op = this._peekToken()
        if (op === PLUS || op === MINUS) {
            this._nextToken()
            node = { left:node, op:op, right: this._expr() }
            return node
        }               
        else if (op === RPAREN || op === undefined || op === null)
            return node
        else
            this._error("UNION or INTERSECTION or ) or NULL", op)
    }
    _term () {
        let node = this._factor()
        let op = this._peekToken()
        if (op === STAR) {
            this._nextToken()
            node = { left:node, op:op, right: this._term() }
        }
        return node
    }
    _factor () {
        let t = this._nextToken()
        if (t === LPAREN){
            let node = this._expr()
            let nt = this._nextToken()
            if (nt !== RPAREN) this._error("')'", nt)
            return node
        }
        else if (t === QUEST) {
          const qstr = this._nextToken()
          if (qstr && !qstr.startsWith(DQUOTE)) this._error("STRING")
          const parts = qstr.slice(1,-1).split(EQUALS, 2)
          if (parts.length !== 2) throw "Bad query string."
          const qtype = parts[0].trim()
          const qval = parts[1].trim()
          return {
            op: t,
            left: qtype,
            right: qval
          }
        }
        else if (t && (t.startsWith(DQUOTE))) {
            return t.substring(1, t.length-1)
        }
        else if (t && t.match(/[a-zA-Z_]/)) {
            return t
        }
        else
            this._error("EXPR or IDENT", t||"NULL")
        return t
            
    }
    _error (expected, saw) {
        throw `Parse error: expected ${expected} but saw ${saw}.`
    }
    // Parses the string and returns the abstract syntax tree.
    // Throws an exception if there is a syntax error.
    parse (s) {
        this._init(s)
        return this._expr()
    }
    format (ast, allParens) {
      if (ast.op) {
        if (ast.op === QUEST) {
          return `?("${ast.left}", "${ast.right}")`
        } else {
          let lf = this.format(ast.left, allParens)
          if (allParens && ast.left.op ||
              ast.left.op && ast.left.op !== ast.op && ast.op === STAR) lf = `(${lf})`
          let rf = this.format(ast.right, allParens)
          if (allParens  && ast.right.op ||
              ast.right.op && ast.right.op !== ast.op && ast.op === STAR) rf = `(${rf})`
          return `${lf} ${ast.op} ${rf}`
        }
      } else {
        return `"${ast}"`
      }
    }
    // returns true iff string is syntactically valid
    isValid (s) {
        try {
            this.parse(s)
            return true
        }
        catch (e) {
            return false
        }
    }
}

export default  ListFormulaParser 
