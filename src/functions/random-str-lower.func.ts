import {TestRunnerFunction, FunctionArgType} from '../services/function.service'
import {getRandomStrLower} from '../utils/rand'

export class RandomStrLowerFunc implements TestRunnerFunction {
  name = 'randomStrLower'

  args: FunctionArgType[] = [FunctionArgType.number, FunctionArgType.number]

  /* we assume args were already validated by the FunctionService */
  public run(...args: any[]): string {
    return getRandomStrLower(args[0], args[1])
  }
}
