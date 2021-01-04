import debugService from './buffered-debug.service'

export enum FunctionArgType {
  number = 'number',
  string = 'string',
  array = 'array',
  object= 'object',
  any = 'any'
}

export interface TestRunnerFunction {
  /* name of the function */
  name: string;

  /* argument types - use `any` or `*` for anything */
  args: FunctionArgType[] | undefined | null;

  /* the actual function implementation */
  run: (...args: any[]) => any;
}
export class FunctionService {
  protected functions: {[key: string]: TestRunnerFunction} = { }

  /**
   * registers a new function
   * @param {TestRunnerFunction} f - function definition as TestRunnerFunction
   */
  public register(f: TestRunnerFunction) {
    this.functions[f.name] = f
  }

  /**
   * retreive function structure based on name
   * @param {string} name - name of function
   * @return {TestRunnerFunction} or {undefined} if function was not found
   */
  public get(name: string): TestRunnerFunction | undefined {
    return this.functions[name]
  }

  /**
   * Validates function arguments passed to a test runner function
   * @param {TestRunnerFunction} f function name
   * @param {any[]} args function args
   *
   * @throws Error if passed args don't match function definition
   */
  public validateArgs(f: TestRunnerFunction, args: any[]) {
    if (f.args === undefined || f.args === null) {
      /* the function doesn't declare any args - probably it'll handle validation on its own */
      return
    }

    /* check that the numbernumber of args matches */
    if (f.args.length !== args.length) {
      throw new Error(`function ${f.name} expects ${f.args.length} parameters; ${args.length} given`)
    }

    /* check that the arg types match */
    for (let i = 0; i < f.args.length; i++) {
      let arr: any[]
      switch (f.args[i]) {
        case FunctionArgType.number:
          if (isNaN(Number(args[i]))) {
            throw new TypeError(`function ${f.name} expects parameter #${i + 1} to be of type ${f.args[i]}; invalid number given`)
          }
          break
        case FunctionArgType.array:
          try {
            arr = JSON.parse(args[i])
          } catch (error) {
            throw new TypeError(`function ${f.name} expects parameter #${i + 1} to be of type ${f.args[i]}; invalid array given`)
          }
          if (!Array.isArray(arr)) {
            throw new TypeError(`function ${f.name} expects parameter #${i + 1} to be of type ${f.args[i]}; ${typeof arr} given`)
          }
          break
        case FunctionArgType.object:
          try {
            arr = JSON.parse(args[i])
          } catch (error) {
            throw new TypeError(`function ${f.name} expects parameter #${i + 1} to be of type ${f.args[i]}; invalid object given`)
          }
          if (typeof arr !== 'object') {
            throw new TypeError(`function ${f.name} expects parameter #${i + 1} to be of type ${f.args[i]}; ${typeof arr} given`)
          }
          break
        case FunctionArgType.any:
        case FunctionArgType.string:
        default:
          break
      }
    }
  }

  /**
   * Calls a function validating the args list first
   * @param {string} name function name
   * @param {any[]} args function args
   *
   * @return {any} function call result
   * @throws Error if the function was not found or the args didn't match function definition args types
   */
  public call(name: string, args: any[]): any {
    debugService.log(`running function ${name} with args ${args.join(',')}`)
    const func = this.get(name)
    if (func === undefined) {
      throw new Error(`unknown function ${name}`)
    }

    /* validate args */
    this.validateArgs(func, args)
    return func.run(...args)
  }
}

export default new FunctionService()
