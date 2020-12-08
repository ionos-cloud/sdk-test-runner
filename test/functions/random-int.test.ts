import {RandomIntFunc} from '../../src/functions/random-int.func'
import {expect} from '@oclif/test'

describe('@randomInt()', () => {
  const min = 3
  const max = 10
  const randomInt = new RandomIntFunc()
  it(`should return an int between ${min} and ${max}`, () => {
    expect(randomInt.run(min, max)).gte(3).lte(10)
  })

  it(`should throw an error when called with (${max}, ${min})`, () => {
    expect(() => randomInt.run(max, min)).to.throw(`getRandomInt(${max}, ${min}): min > max`)
  })
})
