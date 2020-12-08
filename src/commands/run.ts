import {flags} from '@oclif/command'
import cliService from '../services/cli.service'
import {TestRunner} from '../services/test-runner'
import driverService from '../services/driver.service'
import configService from '../services/config.service'
import {Command} from '@oclif/command'
import {Driver} from '../models/driver'
import '../filters'
import '../functions'

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
      throw new Error('No test file specified')
    }

    cliService.info(`using driver ${driver.name}`)
    cliService.info(`driver command is: ${driver.command} ${driver.args.join(' ')}`)

    // const testRunner = new TestRunner('/bin/sh', ['/Users/florin/work/bin/test.sh'])
    const testRunner = new TestRunner(driver)
    testRunner.load(args.file)
    if (flags.test !== undefined) {
      cliService.info(`running only these tests: ${flags.test}`)
      testRunner.selectTests(flags.test)
    }
    if (flags.exclude !== undefined) {
      cliService.info(`excluding tests ${flags.exclude}`)
      testRunner.excludeTests(flags.exclude)
    }

    const stats = await testRunner.run()
    if (stats.failed > 0) {
      this.error('test run ended with failed tests')
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
