import {flags} from '@oclif/command'
import cliService from '../services/cli.service'
import {TestRunner} from '../services/test-runner'
import driverService from '../services/driver.service'
import configService from '../services/config.service'
import {Command} from '@oclif/command'
import {Driver} from '../models/driver'
import '../filters'
import '../functions'
import {TestBatch} from '../models/test-batch'
import chalk from 'chalk'

export default class Run extends Command {
  static description = 'Runs a test suite from a JSON test specification.'

  static examples = [
    '$ csdk-test-runner run',
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    exclude: flags.string({
      char: 'x', multiple: true,
      exclusive: ['test'],
      description: 'exclude tests',
    }),
    test: flags.string({
      char: 't',
      multiple: true,
      exclusive: ['exclude'],
      description: 'run only the specified tests; use -t multiple times to specify more than 1 test',
    }),
    driver: flags.string({
      char: 'd',
      required: false,
      description: 'language driver to use; path and args are taken from config',
    }),
    'fail-fast': flags.boolean({
      char: 'f',
      description: 'exit with failure as soon as a test fails',
      default: false,
    }),
    'driver-path': flags.string({
      required: false,
      exclusive: ['driver'],
      description: 'driver path to use; cannot be specified together with "driver"',
    }),
    'driver-arg': flags.string({
      required: false,
      multiple: true,
      dependsOn: ['driver-path'],
      exclusive: ['driver'],
      description: 'command line arguments to pass to driver; must be specified together with "driver-path"',
    }),
    'driver-cwd': flags.string({
      required: false,
      dependsOn: ['driver-path'],
      exclusive: ['driver'],
      description: 'working directory to run the driver command in',
    }),
    batch: flags.boolean({
      char: 'b',
      required: false,
      description: 'consider the input a batch, meaning it lists a batch of independent tests',
      default: false
    }),
    verbose: flags.boolean({
      description: 'show each assertion evaluation',
    }),
    debug: flags.boolean({
      description: 'show debugging information: verbose + displays each driver command\'s input and output',
    }),
  }

  static args = [
    {name: 'file'},
  ]

  async run() {
    const {args, flags} = this.parse(Run)
    configService.setDebug(flags.debug).setVerbose(flags.verbose)

    /* first of all check credentials env vars */
    if (process.env.IONOS_USERNAME === undefined) {
      this.error('IONOS_USERNAME env var is missing')
    }

    if (process.env.IONOS_PASSWORD === undefined) {
      this.error('IONOS_PASSWORD env var is missing')
    }

    let driver: Driver | undefined
    if (flags.driver !== undefined) {
      driver = driverService.findDriver(flags.driver)
      if (driver === undefined) {
        /* driver not found */
        throw new Error(`Driver ${flags.driver} not found`)
      }
    } else if (flags['driver-path']) {
      driver = {
        name: flags['driver-path'],
        command: flags['driver-path'],
        args: flags['driver-arg'] || [],
        cwd: flags['driver-cwd'],
      }
    } else throw new Error('No driver specified')

    if (args.file === undefined) {
      throw new Error('No file specified')
    }

    configService.setFailFast(flags['fail-fast'])

    cliService.info(`using driver ${driver.name}`)
    cliService.info(`driver command is: ${driver.command} ${driver.args.join(' ')}`)

    let success: boolean
    if (flags.batch) {
      /* load a batch */
      const testBatch = TestBatch.load(args.file)
      success = await testBatch.run(driver, {selected: flags.test, excluded: flags.exclude})
    } else {
      const stats = await TestRunner.runFile(args.file, driver, {selected: flags.test, excluded: flags.exclude})
      success = stats.failed === 0
    }
    if (!success) {
      this.error('test run ended with failed tests 😞')
    } else {
      cliService.info(chalk.greenBright('SUCCESS 😄'))
    }
  }

  async catch(error: any): Promise<any> {
    if (error.oclif === undefined || error.oclif.exit !== 0) {
      this.error(error.message, {
        exit: 1,
      })
    }
  }

  async init(): Promise<any> {
    try {
      await configService.init(this.config.configDir)
    } catch (error) {
      throw new Error('Could not read config file')
    }
    return super.init()
  }
}
