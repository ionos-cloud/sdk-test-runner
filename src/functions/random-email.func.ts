import {TestRunnerFunction} from '../services/function.service'
import {getRandomInt, getRandomStr} from '../utils/rand'
export class RandomEmailFunc implements TestRunnerFunction {
  name = 'randomEmail'

  args = null

  minLen = 5

  maxLen = 20

  domains = ['mailinator.com', 'test.tst']

  public run(...args: any[]): string {
    let domain: string
    if (args.length > 0) {
      domain = args[0]
    } else {
      domain = this.domains[getRandomInt(0, this.domains.length - 1)]
    }
    return `${getRandomStr(this.minLen, this.maxLen)}@${domain}`
  }
}
