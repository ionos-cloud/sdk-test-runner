export class AssertionFailed extends Error {
  public assertionName: string

  public expected: any

  public actual: any

  constructor(assertionName: string, expected: any, actual: any) {
    super(`assertion '${assertionName}' failed: expected ${expected}, actual: ${actual}`)
    this.assertionName = assertionName
    this.expected = expected
    this.actual = actual
  }
}
