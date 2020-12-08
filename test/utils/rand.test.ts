import {expect} from '@oclif/test'
import {getRandomInt, getRandomStr} from '../../src/utils/rand'

describe('randomInt', () => {
  it('should generate an int between 3 and 10', () => {
    const n = getRandomInt(3, 10)
    expect(n).gte(3)
    expect(n).lte(10)
  })

  it('should thrown an error', () => {
    expect(() => getRandomInt(10, 3)).to.throw('getRandomInt(10, 3): min > max')
  })
})

describe('randomStr', () => {
  it('should return a string between 3 and 10 chars', () => {
    const min = 3
    const max = 10
    const str = getRandomStr(min, max)
    expect(str.length).gte(min).lte(max)
  })
})

