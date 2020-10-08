import {AssertionFailed} from '../exceptions/assertion-failed'

export function lt(ctx: any, task: any, value: any, condition: any) {
  task.title = `is lower than ${JSON.stringify(condition)}`
  if (typeof value === 'string') {
    if (typeof condition !== 'string') {
      throw new TypeError(`Cannot check if ${value} is lower than ${condition}`)
    }
    if (value >= condition) {
      throw new AssertionFailed('lt', `< ${condition}`, value)
    }
    return
  }
  if (typeof value === 'number') {
    if (typeof condition !== 'number') {
      throw new TypeError(`Cannot check if ${value} is lower than ${condition}`)
    }
    if (value >= condition) {
      throw new AssertionFailed('lt', `< ${condition}`, value)
    }
    return
  }

  throw new TypeError(`'lt' assertion works only with strings and numbers; ${typeof value} received`)
}
