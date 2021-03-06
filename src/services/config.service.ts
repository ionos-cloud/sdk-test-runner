import {readFileSync, existsSync} from 'fs'
import {Config} from '../models/config'
import {SimpleListrRenderer} from '../utils/simple-listr-renderer'

export class ConfigService {
  public static CONFIG_FILE_NAME = 'config.json'

  private dir = ''

  private config: Config = {drivers: []}

  private initialised = false

  private debug = false

  private verbose = false

  private failFast = false

  public setDebug(d: boolean): this {
    this.debug = d
    return this
  }

  public setVerbose(v: boolean): this {
    this.verbose = v
    return this
  }

  public setFailFast(v: boolean): this {
    this.failFast = v
    return this
  }

  public isDebug(): boolean {
    return this.debug
  }

  public isVerbose(): boolean {
    return this.verbose
  }

  public isFailfast(): boolean {
    return this.failFast
  }

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
        task: (ctx: any, task: any) => {
          const path = `${this.dir}/${ConfigService.CONFIG_FILE_NAME}`
          if (existsSync(path)) {
            cfg = JSON.parse(readFileSync(path, {encoding: 'utf8'}))
          } else {
            task.title = `reading config: config file ${path} not found`
          }
        },
      },
    ], {nonTTYRenderer: SimpleListrRenderer})
    await tasks.run()
    return cfg
  }
}

export default new ConfigService()
