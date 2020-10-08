import {AssertionFailed} from '../exceptions/assertion-failed'

export function getLen(value: any): number {
  let l = 0

  if (typeof value === 'string') {
    l = value.length
  } else if (typeof value === 'object' && Array.isArray(value)) {
    l = value.length
  } else {
    throw new TypeError(`'len, lengte, lenlte' works only with strings and array: ${typeof value} given`)
  }
  return l
}

export function len(ctx: any, task: any, value: any, condition: any) {
  task.title = `length is ${JSON.stringify(condition)}`
  if  (value === null || value === undefined) {
    throw new AssertionFailed('len', condition, value)
  }

  const l = getLen(value)

  if (typeof condition === 'string') {
    if (`${l}` !== `${condition}`) {
      throw new AssertionFailed('len', condition, value)
    }
    return
  }
  if (typeof condition === 'number') {
    if (l !== condition) {
      throw new AssertionFailed('len', condition, value)
    }
    return
  }

  throw new TypeError(`invalid condition for len assertion: expected a number, got ${typeof condition}`)
}
