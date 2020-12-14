import {cli} from 'cli-ux'
import chalk from 'chalk'

export class CliService {
  protected indentLevel = 1

  protected indentString = '  '

  protected buildIndent() {
    let indent = ''
    for (let i = 0; i < this.indentLevel; i++) {
      indent += this.indentString
    }
    return indent
  }

  public h1(msg: string) {
    cli.info('')
    let bar = ''
    for (let i = 0; i < msg.length + 2; i++) {
      bar += '─'
    }
    cli.info(`╭${bar}╮`)
    cli.info(`│ ${msg} │`)
    cli.info(`╰${bar}╯`)
  }

  public indent(amount = 1) {
    this.indentLevel += amount
  }

  public outdent(amount = 1) {
    this.indentLevel -= amount
  }

  public info(msg: string) {
    cli.info('  ❯ ' + msg)
  }

  public warn(msg: string) {
    cli.warn(msg)
  }

  public error(msg: string) {
    cli.error(msg)
  }

  public debug(msg: string) {
    // eslint-disable-next-line no-console
    console.debug(chalk.gray('  ⇢ (debug)'), chalk.gray(msg))
  }

  public print(msg: string) {
    // eslint-disable-next-line no-console
    console.log(this.buildIndent() + msg)
  }
}

export default new CliService()
