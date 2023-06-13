import ListFormulaParser from './ListFormulaParser.js'

// ---------------------------------------------
// Knows how to parse and evaluate a list formula (aka list expression).
class ListFormulaEvaluator {
    constructor (listManager, externalQueries) {
        this.listManager = listManager
        this.queries = externalQueries
        this.parser = new ListFormulaParser()
    }
    // Returns list of other lists referenced by this list's formula
    getDependencies (lst) {
      if (!lst.formula) return []
      const deps = new Set()
      const reach = (n) => {
          if (typeof(n) === "string") {
              let lst = this.listManager.getList(n)
              if (!lst) throw "No such list: " + n
              deps.add(lst)
          } else if (n.op !== "?") {
              reach(n.left)
              reach(n.right)
          }
      }
      const ast = this.parser.parse(lst.formula)
      reach(ast)
      return Array.from(deps)
    }
    refresh (lst, path) {
        this.refreshList(lst).then(() => {
          const deps = this.listManager.getDependents(lst)
          Promise.all(deps.map(dlst => this.refresh(dlst)))
        })
    }
    // If list has a formula, reevaluates the formula and updates the list items.
    // Returns a promise for the items.
    refreshList (lst, deep, path) {
      if (lst.formula) {
        path = (path || [])
        if (path.indexOf(lst) !== -1) throw "Bad formula: reference cycle detected."
        path.push(lst)
        return this.eval(lst.formula, deep, path).then(ids => {
           path.pop()
           this.listManager.updateList(lst, { items: ids })
           return lst.items
        })
      } else {
        return Promise.resolve(lst.items)
      }
    }
    // Evaluates the expression and returns a Promise for the list of ids.
    // If deep is true, recursively forces re-evaluation of formulas for all referenced lists.
    eval (expr, deep, path) {
        let ast = this.parser.parse(expr)
        let lm = this.listManager
        let reach = (n) => {
            if (typeof(n) === "string") {
                let lst = lm.getList(n)
                if (!lst) throw "No such list: " + n
                if (deep) {
                  return this.refreshList(lst, deep, path).then(ids => new Set(ids))
                } else {
                  return Promise.resolve(new Set(lst.items))
                }
            }
            else if (n.op === '?') {
                const qtype = n.left
                const qval = n.right
                const query = this.queries.filter(q => q.name === qtype)[0]
                if (!query) throw "No such query: " + qtype
                return query.handler(qval).then(res => new Set(res))
            } else {
                let lp = reach(n.left)
                let rp = reach(n.right)
                return lp.then(l => rp.then(r => {
                  let s
                  switch (n.op) {
                  case '+':
                  case 'union':
                    s = new Set(l)
                    r.forEach(x => s.add(x))
                    return s
                  case '*':
                  case 'intersection':
                    s = new Set()
                    l.forEach(x => r.has(x) && s.add(x))
                    return s
                  case '-':
                  case 'difference':
                    s = new Set(l)
                    r.forEach(x => s.delete(x))
                    return s
                  default:
                    throw "Unknown operator: " + n.op
                  }
                }))
            }
        }
        return reach(ast).then(ids => Array.from(ids))
    }
    // Checks the current expression for syntactic and semantic validity and sets the 
    // valid/invalid class accordingly. Semantic validity simply means all names in the
    // expression are bound.
    // 
    // Returns null if no expression is passed.
    // Returns true if the expression is valid.
    // Otherwise it returns a string indicating the error.
    //
    isValid  (expr) {
        if (!expr) return null
        try {
            // first check syntax
            const lm  = this.listManager
            const ast = this.parser.parse(expr);
            // now check list names
            const reach = function (n) {
                if (typeof(n) === "string") {
                    let lst = lm.getList(n)
                    if (!lst) throw "No such list: " + n
                } else if (n.op !== "?") {
                    reach(n.left)
                    reach(n.right)
                }
            }
            //
            reach(ast)
            return true
        }
        catch (e) {
            return e
        }
    }
}

export default ListFormulaEvaluator
