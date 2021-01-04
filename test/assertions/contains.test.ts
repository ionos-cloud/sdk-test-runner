import {contains} from '../../src/assertions'
import {assert} from 'chai'

describe('`contains` assertion on arrays', function () {
  it('should work with simple arrays', function () {
    contains(null, null, [1, 2, 3], [2, 3])
  })

  it('should work with array of arrays', function () {
    contains(null, null, [1, [2, 3, 4]], [[2, 3]])
  })

  it('should work with array of objects', function () {
    contains(null, null, [1, 2, {foo: 'bar', a: 'b'}], [{foo: 'bar'}])
  })

  it('should throw an error when subarray is not found', function () {
    assert.throw(() => contains(null, null, [1, [2, 3]], [[4, 5]]))
  })

  it('should throw an error when object is not found in array', function () {
    assert.throw(() => contains(null, null, [1, 2, { foo: 'bar'}], [{bar: 'baz'}]))
  })

  it('should throw an error when elements are not found in array', function () {
    assert.throw(() => contains(null, null, [1, 2, 3], [4]))
  })
})

describe('`contains` assertion on objects', function () {
  it('should work with simple objects', function () {
    contains(null, null, {foo: 'bar', baz: '123'}, {baz: '123'})
  })

  it('should work with nested objects', function () {
    contains(null, null, {foo: 'bar', baz: {prop1: 1, prop2: 2}}, {baz: {prop1: 1}})
  })

  it('should fail on missing nested objects', function () {
    assert.throw(() => contains(null, null, {foo: 'bar', baz: {prop1: 1, prop2: 2}}, {baz: {missingProp: 1}}))
    assert.throw(() => contains(null, null, {foo: 'bar', baz: {prop1: 1, prop2: 2}}, {bar: 123}))
  })
})
