import {NumberFilter} from '../../src/filters/number.filter'
import {expect} from '@oclif/test'

describe('number filter', () => {
  const numberFilter = new NumberFilter()
  it('should return a number', () => {
    expect(numberFilter.process('123')).to.equal(123)
  })
})
