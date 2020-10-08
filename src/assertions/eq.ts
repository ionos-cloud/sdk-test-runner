import {AssertionFailed} from "../exceptions/assertion-failed";
import {strict} from "assert";

export function objectEquals(o1: any, o2: any): boolean {
  if (typeof o1 !== typeof o2) {
    return false
  }
  if (typeof o1 !== 'object') {
    return o1 === o2
  }
  const o1Keys = Object.keys(o1)
  const o2Keys = Object.keys(o2)
  for (const key of o1Keys) {
    if (!o2Keys.includes(key)) return false
    if (typeof o1[key] !== typeof o2[key]) return false
    if (typeof o1[key] === 'object') {
      if (!objectEquals(o1[key], o2[key])) return false
    } else if (o1[key] !== o2[key]) {
      return false
    }
  }
  return true
}

export function eq(ctx: any, task: any, value: any, condition: any) {
  task.title = `equals ${JSON.stringify(condition)}`
  if (typeof value === 'object') {
    if (!objectEquals(value, condition)) {
      throw new AssertionFailed('eq', JSON.stringify(condition), JSON.stringify(value))
    }
  } else if (typeof value === 'number') {
    if (typeof condition === 'number') {
      if (value !== condition) {
        throw new AssertionFailed('eq', condition, value)
      }
    } else if (`${value}` !== condition) {
      /* accept string comparison for numbers */
      throw new AssertionFailed('eq', JSON.stringify(condition), JSON.stringify(value))
    }
  } else if (value !== condition) {
    throw new AssertionFailed('eq', JSON.stringify(condition), JSON.stringify(value))
  }
}
