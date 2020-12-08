import cliService from './cli.service'
import configService from './config.service'

export class BufferedDebugService {
  protected buffer: string[] = []

  public log(message: string) {
    if (configService.isDebug()) {
      this.buffer.push(message)
    }
  }

  /* directly print a debug message - careful: the text will be erased by Listr output if used in
   * the middle of a Listr task */
  public print(msg: any) {
    if (configService.isDebug()) {
      cliService.debug(msg)
    }
  }

  public flush() {
    for (const line of this.buffer) {
      cliService.debug(line)
    }
    this.buffer = []
  }
}

export default new BufferedDebugService()
