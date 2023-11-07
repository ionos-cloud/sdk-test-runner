import {RandomStrLowerFunc} from '../../src/functions/random-str-lower.func'
import {expect} from '@oclif/test'

describe('@randomStrLower()', () => {
  const min = 3
  const max = 10
  const randomStr = new RandomStrLowerFunc()

  it(`should return a string between ${min} and ${max} chars`, () => {
    const str = randomStr.run(min, max)
    expect(str.length).gte(min).lte(max)
  })
})
