import filterService, {Filter} from '../services/filter.service'
import {SymbolRegistry} from '../services/symbol-registry'
import functionService from '../services/function.service'
import debugService from '../services/buffered-debug.service'

export class Parser {
  protected symbolRegistry: SymbolRegistry

  public constructor(symbolRegistry: SymbolRegistry) {
    this.symbolRegistry = symbolRegistry
  }

  public parse(str: string): string | number {
    let ret: any = str
    let found = false
    do {
      found = false
      const tokens = ret.match(/\${[a-zA-Z0-9_/!@#%^&*()\s|.[\]-]+}/g)
      if (tokens === null || !Array.isArray(tokens)) {
        break
      }
      found = true
      for (const token of tokens) {
        let symbol = token.substring(2, token.length - 1)
        let filter: Filter | undefined
        if (symbol.includes('|')) {
          /* we have a filter */
          const [symbolName, filterName] = symbol.split('|').map((x: string) => x.trim())
          symbol = symbolName
          filter = filterService.get(filterName)
          if (filter === undefined) {
            throw new Error(`unknown filter ${filterName}`)
          }
        }
        ret = ret.replace(token, this.symbolRegistry.get(symbol))
        if (filter !== undefined) {
          ret = filter.process(ret)
        }
      }
    } while (found && (typeof ret === 'string'))

    return this.runFunctions(ret)
  }

  public parseObj(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj
    }

    if (typeof obj === 'string') return this.parse(obj)

    if (typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return (obj as Array<any>).map(el => this.parseObj(el))
    }

    const ret: {[key: string]: any} = {}

    for (const key of Object.keys(obj)) {
      ret[this.parse(key)] = this.parseObj(obj[key])
    }

    return ret
  }

  public runFunctions(str: string): string {
    let ret: string = str
    const tokens = ret.matchAll(/@([a-zA-Z0-9_.-]+)\(([a-zA-Z0-9,_./!@#%^&*[\]\s-]*)\)/g)
    for (const match of [...tokens]) {
      /* this will be replaced with the result of the function call */
      const fullMatch = match[0]

      const funcName = match[1]
      const args = match[2] /* x, y, z */
      debugService.print(`parsing function call ${fullMatch}`)
      const trimmedArgs = args.trim()
      const funcResult = functionService.call(funcName, trimmedArgs.length > 0 ? trimmedArgs.split(',').map((x: string) => x.trim()) : [])
      ret = ret.replace(fullMatch, funcResult)
    }
    return ret
  }
}
