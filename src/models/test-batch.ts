import debugService from '../services/buffered-debug.service'
import {readFileSync} from 'fs'
import {RunStats} from './run-stats'
import {RunFileOptions, TestRunner} from '../services/test-runner'
import {Driver} from './driver'
import configService from '../services/config.service'

export class TestBatch {
  files: string[] = []

  public constructor(files: string[]) {
    this.files = files
  }

  public async run(driver: Driver, opts: RunFileOptions): Promise<boolean> {
    let success = true
    for (const file of this.files) {
      const stats: RunStats = await TestRunner.runFile(file, driver, opts)
      success = success && (stats.failed === 0)
      if (stats.failed > 0 && configService.isFailfast()) {
        break
      }
    }
    return success
  }

  static load(file: string): TestBatch {
    debugService.print(`loading batch ${file}`)
    let content: Buffer
    try {
      content = readFileSync(file)
    } catch (error) {
      throw new Error(`Error reading batch file ${file}: ${error.message}`)
    }

    let batch: {[key: string]: any} = {}
    try {
      batch = JSON.parse(content.toString())
    } catch (error) {
      throw new Error(`Parse error in batch file ${file}: ${error.message}`)
    }
    if (batch.files === undefined) {
      throw new Error(`No files declared in batch ${file}`)
    }

    if (!Array.isArray(batch.files)) {
      throw new TypeError(`expected the "files" node to be a list in ${file}; got ${batch.files}`)
    }

    return new TestBatch(batch.files)
  }
}
