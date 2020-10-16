import cliService from './cli.service'
import chalk from 'chalk'

export class CallStackService {
  protected stack: string[] = []

  public push(name: string) {
    for (const element of this.stack) {
      if (element === name) {
        cliService.error(`circular dependency detected: ${this.getCallChain(name)}  → [ ${chalk.red(name)} ]`)
        throw new Error(`circular dependency: ${chalk.red(name)}`)
      }
    }
    this.stack.push(name)
  }

  public pop(): string | undefined {
    return this.stack.pop()
  }

  public getCallChain(highlight: string | undefined = undefined): string {
    let ret = ''
    for (const element of this.stack) {
      if (ret.length > 0) {
        ret += ' → '
      }
      if (element === highlight) {
        ret += '[ ' + chalk.red(element) + ' ]'
      } else {
        ret += element
      }
    }
    return ret
  }
}

export default new CallStackService()
