import {BoolFilter} from '../../src/filters/bool.filter'
import {expect} from '@oclif/test'

describe('bool filter', () => {
  const boolFilter = new BoolFilter()
  it('true should mean true', () => {
    expect(boolFilter.process(true)).to.equal(true)
  })
  it('false should mean false', () => {
    expect(boolFilter.process(false)).to.equal(false)
  })
  it('yes should mean true', () => {
    expect(boolFilter.process('yes')).to.equal(true)
  })
  it('YeS should mean true case insensitively', () => {
    expect(boolFilter.process('YeS')).to.equal(true)
  })
  it('1 should mean true', () => {
    expect(boolFilter.process(1)).to.equal(true)
  })
  it('`1` should mean true', () => {
    expect(boolFilter.process('1')).to.equal(true)
  })
  it('no should mean false', () => {
    expect(boolFilter.process('no')).to.equal(false)
  })
  it('No should mean false case insensitively', () => {
    expect(boolFilter.process('No')).to.equal(false)
  })
  it('0 should mean false', () => {
    expect(boolFilter.process(0)).to.equal(false)
  })
  it('`0` should mean false', () => {
    expect(boolFilter.process('0')).to.equal(false)
  })
  it('null should mean false', () => {
    expect(boolFilter.process(null)).to.equal(false)
  })
  it('undefined should mean false', () => {
    expect(boolFilter.process(undefined)).to.equal(false)
  })
  it('`foobar` should mean false', () => {
    expect(boolFilter.process('foobar')).to.equal(false)
  })
})
