import {JSONPath} from 'jsonpath-plus'

export class SymbolRegistry {
  protected data: {[key: string]: any} = {}

  public save(key: string, value: any): this {
    this.data[key] = value
    return this
  }

  public get(key: string): any {

    if (key.includes('.')) {
      /* json path */
      const path = '$.' + key.substr(key.indexOf('.') + 1)
      const objName = key.substr(0, key.indexOf('.'))
      const obj = this.data[objName]
      if (!obj) return undefined
      // eslint-disable-next-line new-cap
      return JSONPath({path, json: obj, wrap: false})
    }

    return this.data[key]
  }

  public del(key: string): this {
    delete this.data[key]
    return this
  }

  public clear(): this {
    this.data = {}
    return this
  }

  public dump(): string {
    return JSON.stringify(this.data)
  }
}
