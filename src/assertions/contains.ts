import {AssertionFailed} from '../exceptions/assertion-failed'

/* checks if an object contains the keys specifiedin another object, throws AssertionFailed if not */
function objectContainsObject(haystack: {[key: string]: any}, needle: {[key: string]: any}) {
  for (const key of Object.keys(needle)) {
    switch (typeof haystack[key]) {
      case 'undefined':
        throw new AssertionFailed('contains', `to contain ${key} = ${JSON.stringify(needle[key])}`, haystack)
      case 'string':
      case 'number':
      case 'boolean':
        if (haystack[key] !== needle[key]) {
          throw new AssertionFailed('contains', `to contain ${key} = ${JSON.stringify(needle[key])}`, haystack)
        }
        break
      case 'object':
        if (Array.isArray(haystack[key])) {
          if (!Array.isArray(needle[key])) {
            throw new AssertionFailed('contains', `array for key ${key}`, JSON.stringify(needle[key]))
          }
          arrayContains(haystack[key], needle[key])
        } else {
          objectContainsObject(haystack[key], needle[key])
        }
        break
      default:
        throw new AssertionFailed(
          'contains',
          `expected value of key '${key}' to be a 'string', 'number', 'boolean', 'object' or 'array'`,
          `got ${typeof haystack[key]}`
        )
    }
  }
}

function arrayContainsObject(haystack: any[], needle: {[key: string]: any}) {
  let found = false
  for (const item of haystack) {
    if (typeof item === 'object' && !Array.isArray(item)) {
      try {
        objectContainsObject(item, needle)
        found = true
        break
      } catch (error) {
        found = false
      }
    }
  }

  if (!found) {
    throw new AssertionFailed('contains', `to contain ${JSON.stringify(needle)}`, haystack)
  }
}

/* [x, y, [1, 2  3]] contains [ ... , [1, 2], ... ] */
function arrayContainsArray(haystack: any[], subarray: any[]) {
  let found = false
  for (const item of haystack) {
    if (typeof item === 'object' && Array.isArray(item)) {
      try {
        arrayContains(item, subarray)
        found = true
        break
      } catch (error) {
        found = false
      }
    }
  }

  if (!found) {
    throw new AssertionFailed('contains', `to contain ${JSON.stringify(subarray)}`, JSON.stringify(haystack))
  }
}

function arrayContains(haystack: any[], needle: any[]) {
  for (const n of needle) {
    if (typeof n === 'object') {
      if (Array.isArray(n)) {
        arrayContainsArray(haystack, n)
      } else {
        arrayContainsObject(haystack, n)
      }
    } else if (!haystack.includes(n)) {
      throw new AssertionFailed('contains', `array to contain ${JSON.stringify(n)}`, haystack)
    }
  }
}

export function contains(ctx: any, task: any, value: any, condition: any) {
  if (value === null || value === undefined) return

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
    arrayContains(value, condition)
    return
  }

  /* objects */
  if (typeof value === 'object') {
    if (typeof condition !== 'object') {
      throw new TypeError(`'contains' - object value found but '${typeof condition}' condition given; wanted object`)
    }
    objectContainsObject(value, condition)
  }
}
