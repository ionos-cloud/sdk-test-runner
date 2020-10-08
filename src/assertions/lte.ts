import {AssertionFailed} from '../exceptions/assertion-failed'

export function lte(ctx: any, task: any, value: any, condition: any) {
  task.title = `is lower or equal to ${JSON.stringify(condition)}`
  if (typeof value === 'string') {
    if (typeof condition !== 'string') {
      throw new TypeError(`Cannot check if ${value} is lower than ${condition}`)
    }
    if (value > condition) {
      throw new AssertionFailed('lte', `<= ${condition}`, value)
    }
    return
  }
  if (typeof value === 'number') {
    if (typeof condition !== 'number') {
      throw new TypeError(`Cannot check if ${value} is lower than ${condition}`)
    }
    if (value > condition) {
      throw new AssertionFailed('lte', `<= ${condition}`, value)
    }
    return
  }

  throw new TypeError(`'lte' assertion works only with strings and numbers; ${typeof value} received`)
}
