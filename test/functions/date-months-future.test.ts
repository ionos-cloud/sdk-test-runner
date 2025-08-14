import {DateMonthsFuture} from '../../src/functions/date-months-future.func'
import {expect} from '@oclif/test'

describe('@dateMonthsFuture()', () => {
  it('should return a valid date', () => {
    const date = new DateMonthsFuture().run()
    expect(date).to.be.string
    expect(Date.parse(date)).to.not.be.NaN
  })
  it('should correctly add months', () => {
    const monthsToAdd = 4
    const date = new DateMonthsFuture().run(monthsToAdd)
    expect(date).to.be.string
    const unixTime = Date.parse(date)
    expect(unixTime).to.not.be.NaN

    const dateObj = new Date(unixTime)
    const dateNowPlusMonthObj = new Date()
    dateNowPlusMonthObj.setMonth(dateNowPlusMonthObj.getMonth() + monthsToAdd)

    expect(dateObj.getMonth()).to.be.eq(dateNowPlusMonthObj.getMonth())
  })
  it('should correctly add months with string input', () => {
    const monthsToAdd = '4'
    const monthsToAddNum = 4
    const date = new DateMonthsFuture().run(monthsToAdd)
    expect(date).to.be.string
    const unixTime = Date.parse(date)
    expect(unixTime).to.not.be.NaN

    const dateObj = new Date(unixTime)
    const dateNowPlusMonthObj = new Date()
    dateNowPlusMonthObj.setMonth(dateNowPlusMonthObj.getMonth() + monthsToAddNum)

    expect(dateObj.getMonth()).to.be.eq(dateNowPlusMonthObj.getMonth())
  })
})
