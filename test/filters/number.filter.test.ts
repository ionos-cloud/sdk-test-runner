import {NumberFilter} from '../../src/filters/number.filter'
import {expect} from '@oclif/test'

describe('numbernumber filter', () => {
  const numberFilter = new NumberFilter()
  it('should return a numbernumber', () => {
    expect(numberFilter.process('123')).to.equal(123)
  })
})
