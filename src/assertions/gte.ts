import {AssertionFailed} from '../exceptions/assertion-failed'

export function gte(ctx: any, task: any, value: any, condition: any) {
  task.title = `is greater or equal to ${JSON.stringify(condition)}`
  if (typeof value === 'string') {
    if (typeof condition !== 'string') {
      throw new TypeError(`Cannot check if ${value} is greater than ${condition}`)
    }
    if (value < condition) {
      throw new AssertionFailed('gte', `>= ${condition}`, value)
    }
    return
  }
  if (typeof value === 'number') {
    if (typeof condition !== 'number') {
      throw new TypeError(`Cannot check if ${value} is greater than ${condition}`)
    }
    if (value < condition) {
      throw new AssertionFailed('gt', `>= ${condition}`, value)
    }
    return
  }

  throw new TypeError(`'gte' assertion works only with strings and numbers; ${typeof value} received`)
}
