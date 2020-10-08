import {AssertionFailed} from '../exceptions/assertion-failed'
import {getLen} from './len'

export function lenlte(ctx: any, task: any, value: any, condition: any) {
  task.title = `length is lower or equal to ${JSON.stringify(condition)}`
  if  (value === null || value === undefined) {
    throw new AssertionFailed('len', condition, value)
  }

  const l = getLen(value)

  if (typeof condition === 'number') {
    if (l > condition) {
      throw new AssertionFailed('lenlte', `<= ${condition}`, value)
    }
    return
  }

  throw new TypeError(`invalid condition for len assertion: expected a number, got ${typeof condition}`)
}
