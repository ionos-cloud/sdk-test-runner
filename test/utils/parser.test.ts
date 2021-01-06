import {SymbolRegistry} from '../../src/services/symbol-registry'
import {Parser} from '../../src/utils/parser'
import {assert} from 'chai'
import filterService from '../../src/services/filter.service'
import {ToLowerFilter} from '../../src/filters/tolower.filter'
import {NumberFilter} from '../../src/filters/number.filter'

describe('parser tests', () => {
  const reg = new SymbolRegistry()

  const parser = new Parser(reg)

  before(() => {
    filterService.register(new ToLowerFilter())
    filterService.register(new NumberFilter())
  })

  beforeEach(() => reg.clear())

  it('number filter should work', () => {
    reg.save('data', {
      foo: '123'
    })
    // eslint-disable-next-line no-template-curly-in-string
    assert.isTrue(parser.parse('${data.foo | number}') === 123)
  })
  it('should parse toLower correctly', () => {
    reg.save('data', {
      fooBar: 'aBc',
      barBaz: 'def'
    })

    // eslint-disable-next-line no-template-curly-in-string
    assert.equal(parser.parse('${data.fooBar}.test.${data.barBaz}'), 'aBc.test.def')
    // eslint-disable-next-line no-template-curly-in-string
    assert.equal(parser.parse('${data.fooBar | toLower}'), 'abc')
    // eslint-disable-next-line no-template-curly-in-string
    assert.equal(parser.parse('${data.fooBar | toLower}.test.${data.barBaz}'), 'abc.test.def')
  })
})
