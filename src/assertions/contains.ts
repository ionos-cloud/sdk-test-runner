import {AssertionFailed} from '../exceptions/assertion-failed'

export function contains(ctx: any, task: any, value: any, condition: any) {
  if (value === null || value === undefined) return false

  /* string */
  if (typeof value === 'string') {
    if (typeof condition !== 'string') {
      throw new TypeError(`'contains' - string value found but '${typeof condition}' condition given; wanted string`)
    }
    if (!value.includes(condition)) {
      throw new AssertionFailed('contains', `to contain ${condition}`, value)
    }
    return
  }

  /* array */
  if (typeof value === 'object' && Array.isArray(value)) {
    if (typeof condition !== 'object' || !Array.isArray(condition)) {
      throw new TypeError(`'contains' - array value found but '${typeof condition}' condition given; wanted array`)
    }
    for (const el of (condition as Array<any>)) {
      if (!value.includes(el)) {
        throw new AssertionFailed('contains', `to include ${el}`, value)
      }
    }
    return
  }

  /* objects */
  if (typeof value === 'object') {
    if (typeof condition !== 'object') {
      throw new TypeError(`'contains' - object value found but '${typeof condition}' condition given; wanted object`)
    }
    for (const key of Object.keys(condition)) {
      if (typeof value[key] === 'string' || typeof value[key] === 'number') {
        if (value[key] !== condition[key]) {
          throw new AssertionFailed('contains', `to contain ${key} = ${JSON.stringify(condition[key])}`, value)
        }
      } else {
        contains(ctx, task, value[key], condition[key])
      }
    }
  }
}
