import {TestRunnerFunction, FunctionArgType} from '../services/function.service'
import {getRandomInt} from '../utils/rand'

export class RandomIntFunc implements TestRunnerFunction {
  name = 'randomInt'

  args: FunctionArgType[] = [FunctionArgType.number, FunctionArgType.number]

  /* we assume args were already validated by the FunctionService */
  public run(...args: any[]): number {
    return getRandomInt(args[0], args[1])
  }
}
