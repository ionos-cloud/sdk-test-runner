import {TestRunnerFunction} from '../services/function.service'

export class DateMonthsFuture implements TestRunnerFunction {
  name = 'randomEmail'

  args = null

  minLen = 5

  maxLen = 20

  domains = ['mailinator.com', 'test.tst']

  public run(...args: any[]): string {
    let monthNo: number
    if (args.length > 0) {
      monthNo = args[0]
    } else {
      monthNo = 1
    }

    // chatGPT
    function getFormattedDateTime(incrementMonth: number) {
      const now = new Date()
      now.setMonth(now.getMonth() + incrementMonth)

      // Get date parts with leading zeros
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0') // months 0-11
      const day = String(now.getDate()).padStart(2, '0')

      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')

      // Get timezone offset in minutes and convert to ±HH:mm
      const timezoneOffset = -now.getTimezoneOffset() // reversed sign from getTimezoneOffset
      const sign = timezoneOffset >= 0 ? '+' : '-'
      const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0')
      const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0')

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMinutes}`
    }

    return `${getFormattedDateTime(monthNo)}`
  }
}
