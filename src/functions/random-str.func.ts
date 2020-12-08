import {TestRunnerFunction, FunctionArgType} from '../services/function.service'
import {getRandomStr} from '../utils/rand'

export class RandomStrFunc implements TestRunnerFunction {
  name = 'randomStr'

  args: FunctionArgType[] = [FunctionArgType.number, FunctionArgType.number]

  /* we assume args were already validated by the FunctionService */
  public run(...args: any[]): string {
    return getRandomStr(args[0], args[1])
  }
}
