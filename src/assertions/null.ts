import {AssertionFailed} from '../exceptions/assertion-failed'

export function isNull(ctx: any, task: any, value: any, condition: any) {
  task.title = 'is null'
  if (typeof condition !== 'boolean') {
    throw new TypeError(`expected boolean condition for null assertion; got ${typeof condition}`)
  }

  let failed = false
  switch (condition as boolean) {
  case true:
    failed = (value !== null && value !== undefined)
    break
  case false:
    failed = (value === null || value === undefined)
    break
  }

  if (failed) {
    throw new AssertionFailed('null', condition, !condition)
  }
}

