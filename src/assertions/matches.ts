import {AssertionFailed} from '../exceptions/assertion-failed'

export function matches(ctx: any, task: any, value: any, condition: any) {
  task.title = `matches ${JSON.stringify(condition)}`
  if (typeof value !== 'string') {
    throw new TypeError(`'matches' expects a string value; '${typeof value}' given`)
  }
  if (typeof condition !== 'string') {
    throw new TypeError(`'matches' expects a string condition; '${typeof condition}' given`)
  }

  if (!value.match(condition)) {
    throw new AssertionFailed('matches', condition, value)
  }
}
