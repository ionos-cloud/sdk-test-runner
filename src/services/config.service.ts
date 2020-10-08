import {readFileSync} from 'fs'
import {Config} from '../models/config'

export class ConfigService {
  public static CONFIG_FILE_NAME = 'config.json'

  private dir = ''

  private config: Config = {drivers: []}

  private initialised = false

  public async init(dir: string) {
    if (!this.initialised) {
      this.dir = dir
      this.config = await this.readConfig()
      this.initialised = true
    }
  }

  public get(): Config {
    return this.config
  }

  private async readConfig(): Promise<Config> {
    const Listr = require('listr')
    let cfg: Config = {drivers: []}
    const tasks = new Listr([
      {
        title: 'reading config',
        task: () => {
          const path = `${this.dir}/${ConfigService.CONFIG_FILE_NAME}`
          cfg = JSON.parse(readFileSync(path, {encoding: 'utf8'}))
        },
      },
    ])
    await tasks.run()
    return cfg
  }
}

export default new ConfigService()
