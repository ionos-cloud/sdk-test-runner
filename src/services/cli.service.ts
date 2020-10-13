import {cli} from 'cli-ux'
import chalk from 'chalk'

export class CliService {
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
}

export default new CliService()
