import {RandomEmailFunc} from '../../src/functions/random-email.func'
import {expect} from '@oclif/test'

describe('@randomEmail()', () => {
  it('should return a valid email', () => {
    const email = new RandomEmailFunc().run()
    expect(email.length).gte(0)
    expect(email).to.contain('@')
    expect(email).to.contain('.')
  })

  it('should return a valid email @google.com', () => {
    const domain = 'google.com'
    const email = new RandomEmailFunc().run(domain)
    expect(email.length).gte(0)
    expect(email.endsWith(`@${domain}`)).true
  })
})
