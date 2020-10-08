import {cli} from 'cli-ux'

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
    cli.debug(msg)
  }
}

export default new CliService()
