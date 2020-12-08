import {RandomStrFunc} from '../../src/functions/random-str.func'
import {expect} from '@oclif/test'

describe('@randomStr()', () => {
  const min = 3
  const max = 10
  const randomStr = new RandomStrFunc()

  it(`should return a string between ${min} and ${max} chars`, () => {
    const str = randomStr.run(min, max)
    expect(str.length).gte(min).lte(max)
  })
})
