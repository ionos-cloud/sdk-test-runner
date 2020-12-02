export class BoolFilter {
  name = 'bool'

  public process(value: any): any {
    if (typeof value === 'boolean') {
      return value
    }

    if (typeof value === 'number') {
      return value === 1
    }

    if (typeof value !== 'string') {
      return value !== null && value !== undefined
    }

    const lowerVal = value.toLowerCase()

    const valueMap: {[key: string]: boolean} = {
      yes: true,
      true: true,
      1: true,
      no: false,
      false: false,
      0: false,
    }

    if (valueMap[lowerVal] !== undefined) {
      return valueMap[lowerVal]
    }

    return false
  }
}
