import {ArrayFilter} from '../../src/filters/array.filter'
import {expect} from '@oclif/test'

describe('array filter', () => {
  const arrayFilter = new ArrayFilter()

  const tests: {[key: string]: any} = {
    'a, b, c': ['a', 'b', 'c'],
    'a,b,c': ['a', 'b', 'c'],
  }

  for (const input of Object.keys(tests)) {
    it(input, () => {
      expect(arrayFilter.process(input)).to.eql(tests[input])
    })
  }

  it('should leave arrays untouched', () => {
    expect(arrayFilter.process([1, 2, 3])).to.eql([1, 2, 3])
  })

  it('should leave objects untouched', () => {
    expect(arrayFilter.process({foo: 'bar'})).to.eql({foo: 'bar'})
  })
})
