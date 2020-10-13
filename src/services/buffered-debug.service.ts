import cliService from './cli.service'

export class BufferedDebugService {
  protected buffer: string[] = []

  public log(message: string) {
    this.buffer.push(message)
  }

  public flush() {
    for (const line of this.buffer) {
      cliService.debug(line)
    }
    this.buffer = []
  }
}

export default new BufferedDebugService()
