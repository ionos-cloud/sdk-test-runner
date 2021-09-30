import {TestSuite} from '../models/test-suite'
import {Test, TestKind} from '../models/test'

import {readFileSync} from 'fs'
import {TestPayload} from '../models/test-payload'

import {SymbolRegistry} from './symbol-registry'

import execa from 'execa'
import {Assertion, evalAssertion} from '../models/assertion'
import cliService from '../services/cli.service'
import {ListrTask, ListrTaskWrapper} from 'listr'

import chalk from 'chalk'
import debugService from './buffered-debug.service'
import {formatDuration, getDuration} from '../utils/misc'
import {SimpleListrRenderer} from '../utils/simple-listr-renderer'
import {RunStats} from '../models/run-stats'
import {Driver} from '../models/driver'
import {Parser} from '../utils/parser'
import callStackService, {CallStackService} from './call-stack.service'
import configService from './config.service'

import * as path from 'path'
import deepmerge from 'deepmerge'

import Listr = require('listr');

export enum TestResult {
  SUCCESS,
  FAILED,
  SKIPPED
}

export enum TestRunnerPhase {
  SETUP = 0,
  TESTS,
  CLEANUP
}

export interface RunFileOptions {
  selected?: string[];
  excluded?: string[];
}

export class TestRunner {
  protected phase: TestRunnerPhase = TestRunnerPhase.SETUP

  protected testSuite: TestSuite = {
    tests: [],
  }

  protected runResults: {[key: string]: TestResult} = {}

  protected commandError: {[key: string]: boolean} = {}

  protected symbolRegistry: SymbolRegistry

  protected parser: Parser

  protected driver: Driver

  protected failedTests = 0

  protected skippedTests = 0

  protected selectedTests: string[] | undefined = undefined

  protected excludedTests: string[] = []

  protected includeStack: CallStackService = new CallStackService()

  constructor(driver: Driver) {
    this.driver = driver
    this.symbolRegistry = new SymbolRegistry()
    this.parser = new Parser(this.symbolRegistry)
  }

  protected findTestAnywhere(name: string): boolean {
    const foundInTests = this.testSuite.tests?.find(t => t.name === name) !== undefined
    const foundInSetup = this.testSuite.setup?.find(t => t.name === name) !== undefined
    const foundInCleanup = this.testSuite.cleanup?.find(t => t.name === name) !== undefined
    return foundInTests || foundInSetup || foundInCleanup
  }

  public selectTests(testNames: string[]): this {
    this.selectedTests = []
    for (const name of testNames) {
      if (this.findTestAnywhere(name)) {
        this.selectedTests.push(name)
      } else {
        cliService.warn(`selected test ${name} not found, ignoring it`)
      }
    }
    return this
  }

  public excludeTests(testNames: string[]): this {
    for (const name of testNames) {
      if (this.findTestAnywhere(name)) {
        this.excludedTests.push(name)
      } else {
        cliService.warn(`excluded test ${name} not found, ignoring it`)
      }
    }
    return this
  }

  public async setup() {
    this.phase = TestRunnerPhase.SETUP
    if (typeof this.testSuite.setup === 'undefined') return
    cliService.info('running setup tests')
    for (const test of this.testSuite.setup) {
      // eslint-disable-next-line no-await-in-loop
      if (!await this.runTest(test)) {
        throw new Error(`Test ${test.name} from the setup sequence failed.`)
      }
    }
  }

  public async cleanup() {
    this.phase = TestRunnerPhase.CLEANUP
    if (typeof this.testSuite.cleanup === 'undefined') return
    cliService.info('running cleanup tests')
    for (const test of this.testSuite.cleanup) {
      // eslint-disable-next-line no-await-in-loop
      await this.runTest(test)
    }
  }

  protected async runDeps(test: Test): Promise<TestResult> {
    debugService.log(`(${test.name}) running dependencies`)
    if (typeof (test.dependencies) === 'string') {
      test.dependencies = [test.dependencies]
    }
    if (!Array.isArray(test.dependencies)) {
      return TestResult.SUCCESS
    }
    for (const dep of test.dependencies) {
      const depTest = this.findTest(dep)
      if (depTest === undefined) {
        cliService.warn(`dependency '${dep}' of test '${test.name}' was not found; ignoring it`)
        continue
      }

      // eslint-disable-next-line no-await-in-loop
      const outcome = await this.runTest(depTest)

      if (this.commandError[depTest.name]) {
        /* dep couldn't run, fail this test also */
        this.failedTests++
        this.runResults[test.name] = TestResult.FAILED
        this.commandError[test.name] = true

        /* display it for the user to know */
        const mainTask = new Listr([
          {
            title: this.getTestTitle(test),
            task: () => {
              throw new Error(`dependency '${depTest.name}' failed to run`)
            },
          },
        ], {nonTTYRenderer: SimpleListrRenderer, concurrent: false, exitOnError: false})
        try {
          // eslint-disable-next-line no-await-in-loop
          await mainTask.run()
        } catch (error) {}
        return this.runResults[test.name]
      }

      let reason = 'was skipped'
      switch (outcome) {
        case TestResult.FAILED:
          reason = 'failed'
        // eslint-disable-next-line no-fallthrough
        case TestResult.SKIPPED:
          /* copy dep outcome i.e. if skipped, mark it skipped */
          this.runResults[test.name] = TestResult.SKIPPED
          this.skippedTests++
          try {
            await new Listr([
              {
                title: this.getTestTitle(test),
                task: () => '',
                skip: () => `dependency '${depTest.name}' ${reason}`,
              },
            ], {nonTTYRenderer: SimpleListrRenderer, concurrent: false, exitOnError: false}).run()
          } catch (error) {
            cliService.error(error.message)
          }
          return this.runResults[test.name]
      }
    }
    return TestResult.SUCCESS
  }

  protected getTestTitle(test: Test) {
    let total = 0
    switch (test.kind) {
      case TestKind.CLEANUP:
        total = this.testSuite.cleanup?.length || 0
        break
      case TestKind.SETUP:
        total = this.testSuite.setup?.length || 0
        break
      case TestKind.TEST:
        total = this.testSuite.tests?.length || 0
        break
    }
    return `${test.kind.toUpperCase()} (${test.id}/${total}): ${test.name}`
  }

  protected async skipTest(test: Test, reason: string) {
    const mainTask = new Listr([
      {
        title: this.getTestTitle(test),
        skip: () => reason,
        task: () => '',
      },
    ], {nonTTYRenderer: SimpleListrRenderer, concurrent: false, exitOnError: false})

    await mainTask.run()

    this.skippedTests++
    this.runResults[test.name] = TestResult.SKIPPED
  }

  protected buildDriverSubtask(test: Test): ListrTask[] {
    debugService.print(`(${test.name}) building driver subtask`)
    return [
      {
        title: 'running driver command',
        task: async (ctx: any, _: ListrTaskWrapper) => {
          /* run command */
          ctx.startTime = process.hrtime()
          let result = null
          try {
            if (test.type === 'shell_command') {
              result = await this.runBashCommand(this.parser.parseObj(test.payload))
            } else {
              result = await this.runCommand(this.parser.parseObj(test.payload))
            }
            this.commandError[test.name] = false
          } catch (error) {
            debugService.log(`command error: ${error}`)
            this.commandError[test.name] = true
            ctx.commandFailure = true
            throw error
          }

          /* save data into symbol registry */
          if (test.parse_output === undefined || test.parse_output) {
            ctx.resultObj = JSON.parse(result)
            for (const resultKey of Object.keys(ctx.resultObj)) {
              this.symbolRegistry.save(resultKey, ctx.resultObj[resultKey])
            }

            if (typeof test.save !== 'undefined') {
              for (const symbol of Object.keys(test.save)) {
                const target = test.save[symbol]
                const value = this.symbolRegistry.get(symbol)
                this.symbolRegistry.save(target, value)
              }
            }
          } else {
            ctx.resultObj = []
          }
        },
      },
    ]
  }

  protected buildAssertionsSubtasks(assertions: {[key: string]: Assertion} | undefined): { subtasks: ListrTask[]; collapse: boolean} {
    debugService.print('building assertion subtasks')
    let collapse = true
    const subtasks: ListrTask[] = []
    if (typeof assertions === 'undefined') {
      return {subtasks, collapse}
    }
    for (const symbol of Object.keys(assertions)) {
      if (assertions[symbol].print !== undefined) {
        /* we want to keep the tests open if we have a print inside them, to keep the message visible */
        collapse = false
      }
      subtasks.push(
        {
          title: `evaluating '${symbol}'`,
          task: (ctx: any, task: ListrTaskWrapper) => {
            const value = this.parser.parseObj(this.symbolRegistry.get(`${this.parser.parse(symbol)}`))
            task.title += ` = ${JSON.stringify(value)}`
            return evalAssertion(value, this.parser.parseObj(assertions[symbol]))
          },
          skip: ctx => ctx.commandFailure ? 'driver command failed' : false,
        }
      )
    }
    return {subtasks, collapse}
  }

  protected runAssertionGroup(title: string, assertions: {[key: string]: Assertion} | undefined): Promise<any> {
    const { subtasks, collapse } = this.buildAssertionsSubtasks(assertions)
    const listrOptions = {
      nonTTYRenderer: SimpleListrRenderer, concurrent: false,
      exitOnError: false,
      collapse: collapse && !configService.isVerbose() && !configService.isDebug()
    }
    return new Listr(
      [{
        title: title,
        task: () => {
          return new Listr(subtasks)
        }
      }],
      listrOptions
    ).run()
  }

  protected async shouldLoop(test: Test): Promise<boolean> {
    if (typeof test.until === 'undefined') {
      return false
    }
    try {
      await this.runAssertionGroup('checking loop exit conditions', test.until)
    } catch (error) {
      return true
    }

    cliService.info('exit condition met; braking from loop.')
    return false
  }

  protected buildCleanupSubtasks(parentTask: any): ListrTask[] {
    return [{
      title: 'cleaning up command results',
      task: async ctx => {
        /* remove command output from registry to make room for the next test */
        for (const resultKey of Object.keys(ctx.resultObj)) {
          this.symbolRegistry.del(resultKey)
        }
        const duration = process.hrtime(ctx.startTime)
        parentTask.title += ` (${formatDuration(getDuration(duration[0]), duration[1] / 1000000)})`
      },
      skip: ctx => ctx.commandFailure ? 'driver command failed' : false,
    }]
  }

  protected buildIfSubtask(test: Test): ListrTask[] {
    if (test.if === undefined) {
      return []
    }

    const {subtasks, collapse} = this.buildAssertionsSubtasks(test.if)
    const listrOptions = {
      concurrent: false,
      nonTTYRenderer: SimpleListrRenderer,
      collapse: collapse
    }
    return [{
      title: 'checking `if` conditions',
      task: () => new Listr(subtasks, listrOptions)
    }]
  }

  protected buildMainTask(test: Test, iteration?: number, maxCount?: number): Listr {
    const assertionSubtasks = this.buildAssertionsSubtasks(test.assert)

    let title = this.getTestTitle(test)
    if (typeof iteration !== 'undefined') {
      if (typeof maxCount === 'undefined') {
        title += ` ( loop #${iteration} )`
      } else {
        title += ` ( loop #${iteration} / ${maxCount} )`
      }
    }

    const listrOptions = {
      nonTTYRenderer: SimpleListrRenderer, concurrent: false,
      exitOnError: false,
      collapse: assertionSubtasks.collapse && !configService.isVerbose() && !configService.isDebug(),
    }
    return new Listr([
      {
        title: title,
        task: (ctx: any, task: any) => new Listr([
          ...this.buildIfSubtask(test),
          ...this.buildDriverSubtask(test),
          ...assertionSubtasks.subtasks,
          ...this.buildCleanupSubtasks(task),
        ], {concurrent: false, exitOnError: false}),
      },
    ], listrOptions
    )
  }

  public async runTest(test: Test): Promise<TestResult> {
    let ret = TestResult.SUCCESS

    try {
      callStackService.push(test.name)
    } catch (error) {
      this.failedTests++
      this.runResults[test.name] = TestResult.FAILED
      throw error
    }

    if (this.runResults[test.name] !== undefined) {
      /* test already ran */
      callStackService.pop()
      return this.runResults[test.name]
    }

    debugService.print(`running test ${test.name}`)

    /* check if the test was excluded from the run-set */
    if (this.excludedTests.includes(test.name)) {
      await this.skipTest(test, 'excluded by user')
      callStackService.pop()
      return this.runResults[test.name]
    }

    /* check the if clause */

    /* solve dependencies */
    const depsResult = await this.runDeps(test)
    if (depsResult !== TestResult.SUCCESS) {
      callStackService.pop()
      /* deps failed or were skipped */
      return depsResult
    }
    try {
      const sleep = (ms: number) => new Promise((resolve, _) => setTimeout(resolve, ms))

      let iteration = 1
      const max_count = test.max_count || 0
      let doContinue = false
      do {
        const mainTask = await this.buildMainTask(test, test.repeat ? iteration : undefined, test.repeat ? test.max_count : undefined)
        this.symbolRegistry.save('loop_iteration', iteration)
        if (iteration > 1 && typeof test.delay_between_iterations !== 'undefined') {
          cliService.info(`sleeping ${test.delay_between_iterations} ms before next iteration`)
          // eslint-disable-next-line no-await-in-loop
          await sleep(test.delay_between_iterations)
        }
        await mainTask.run()
        iteration++
        doContinue = typeof test.until === 'undefined' || await this.shouldLoop(test)
      } while (test.repeat && doContinue && max_count >= iteration)
    } catch (error) {
      if (typeof error.errors !== 'undefined') {
        /* mark test as failed */
        this.failedTests++
        ret = TestResult.FAILED
      } else {
        debugService.flush()
        throw error
      }
    } finally {
      debugService.flush()
    }

    callStackService.pop()
    this.runResults[test.name] = ret
    return ret
  }

  // eslint-disable-next-line no-warning-comments
  /* todo implement timeout */
  protected async runCommand(payload: TestPayload): Promise<string> {
    try {
      const input = JSON.stringify(payload)
      debugService.log(`${chalk.yellow('driver input')}: ${input}`)
      const options: execa.Options = {
        input,
        cwd: (typeof this.driver.cwd === 'undefined') ? process.cwd() : this.driver.cwd,
        maxBuffer: 100_000_000
      }
      const subprocess = execa(this.driver.command, this.driver.args, options)
      const out = await subprocess
      debugService.log(`${chalk.yellow('driver output')}: ${out.stdout}`)
      debugService.log(`${chalk.yellow('driver stderr')}: ${out.stderr}`)
      return out.stdout
    } catch (error) {
      debugService.log(`${chalk.yellowBright('driver error')}: ${error.message}`)
      throw new Error(`Error running command ${this.driver.command}: ${error.message}`)
    }
  }

  protected async runBashCommand(payload: TestPayload) {
    try {
      const input = JSON.stringify(payload)
      debugService.log(`${chalk.yellow('bash input')}: ${input}`)
      const options: execa.Options = {
        cwd: process.cwd(),
        env: payload.env,
        maxBuffer: 100_000_000
      }
      if (payload.command === undefined) {
        throw new Error('`command` required parameter is not set')
      }
      const command = payload.command
      const subprocess = execa(command, payload.args, options)
      const out = await subprocess
      debugService.log(`${chalk.yellow('bash output')}: ${out.stdout}`)
      debugService.log(`${chalk.yellow('bash stderr')}: ${out.stderr}`)
      return out.stdout
    } catch (error) {
      debugService.log(`${chalk.yellowBright('bash error')}: ${error.message}`)
      throw new Error(`Error running command ${this.driver.command}: ${error.message}`)
    }
  }

  public findTest(name: string): Test | undefined {
    let haystack: Test[] = []
    switch (this.phase) {
      case TestRunnerPhase.SETUP:
        haystack = this.testSuite.setup || []
        break
      case TestRunnerPhase.TESTS:
        haystack = this.testSuite.tests || []
        break
      case TestRunnerPhase.CLEANUP:
        if (this.testSuite.tests !== undefined) {
          haystack = [...haystack, ...this.testSuite.tests]
        }
        if (this.testSuite.cleanup !== undefined) {
          haystack = [...haystack, ...this.testSuite.cleanup]
        }
    }
    return haystack.find((t: Test) => t.name === name)
  }

  protected unshiftIt(into: any[] | undefined, what: any[]): any[] {
    if (into === undefined) {
      return [...what]
    }
    return [...what, ...into]
  }

  protected checkDuplicateNames(suite: TestSuite) {
    if (suite.tests === undefined) {
      return
    }
    /* check for duplicate test names */
    const names: {[key: string]: boolean} = {}
    for (const test of suite.tests) {
      if (names[test.name] !== undefined) {
        throw new Error(`test '${test.name}' defined multiple times`)
      }
      names[test.name] = true
    }
  }

  protected addIncludedTests(included: TestSuite[], testSuite: TestSuite) {
    const includedTests: Test[] = []
    const includedSetup: Test[] = []
    const includedCleanup: Test[] = []
    let includedData: {[key: string]: any} = {}
    for (const subTestSuite of included) {
      if (subTestSuite.tests !== undefined) {
        includedTests.push(...subTestSuite.tests)
      }
      if (subTestSuite.setup !== undefined) {
        includedSetup.push(...subTestSuite.setup)
      }

      if (subTestSuite.cleanup !== undefined) {
        includedCleanup.push(...subTestSuite.cleanup)
      }

      if (subTestSuite.data !== undefined) {
        includedData = deepmerge.all([includedData, subTestSuite.data])
      }
    }

    testSuite.tests = this.unshiftIt(testSuite.tests, includedTests)
    testSuite.setup = this.unshiftIt(testSuite.setup, includedSetup)
    testSuite.cleanup = this.unshiftIt(testSuite.cleanup, includedCleanup)

    if (testSuite.data !== undefined) {
      testSuite.data = deepmerge.all([includedData, testSuite.data])
    } else {
      testSuite.data = includedData
    }
  }

  public loadTestSuite(suite: string): TestSuite {
    let testSuite: TestSuite
    try {
      testSuite = JSON.parse(suite)
      if (testSuite.tests === undefined) {
        testSuite.tests = []
      }
    } catch (error) {
      throw new Error(`Syntax error in test suite: ${error.message}`)
    }
    if (typeof testSuite.include === 'undefined') return testSuite

    const included: TestSuite[] = []
    for (const inc of testSuite.include) {
      let content: Buffer
      try {
        debugService.print(`loading included file ${inc}`)
        this.includeStack.push(path.basename(inc))
        content = readFileSync(inc)
      } catch (error) {
        throw new Error(`Error reading file ${inc}: ${error.message}`)
      }
      included.push(this.loadTestSuite(content.toString()))
      this.includeStack.pop()
    }
    this.addIncludedTests(included, testSuite)
    return testSuite
  }

  public load(fileName: string): TestRunner {
    let content: Buffer
    try {
      this.includeStack.push(path.basename(fileName))
      debugService.print(`loading file ${fileName}`)
      content = readFileSync(fileName)
    } catch (error) {
      throw new Error(`Error reading file ${fileName}: ${error.message}`)
    }
    this.testSuite = this.loadTestSuite(content.toString())
    this.checkDuplicateNames(this.testSuite)
    return this
  }

  protected genIds() {
    this.testSuite.tests?.forEach((t, id) => {
      t.id = id + 1
      t.kind = TestKind.TEST
    })

    this.testSuite.setup?.forEach((t, id) => {
      t.id = id + 1
      t.kind = TestKind.SETUP
    })

    this.testSuite.cleanup?.forEach((t, id) => {
      t.id = id + 1
      t.kind = TestKind.CLEANUP
    })
  }

  protected saveData(data: {[key: string]: any}) {
    const processedData: {[key: string]: any} = {}
    for (const key of Object.keys(data)) {
      /* not replacing symbols in data[key] here to allow this to happen
       * later on, after this data is saved in the registry, otherwise we would get
       * undefined now */
      if (typeof data[key] === 'string') {
        processedData[this.parser.parse(key)] = this.parser.runFunctions(data[key])
      } else {
        processedData[this.parser.parse(key)] = data[key]
      }
    }
    this.symbolRegistry.save('data', processedData)
  }

  public async run(): Promise<RunStats> {
    this.runResults = {}
    this.commandError = {}

    this.symbolRegistry.clear()

    /* saving environment to be accessible in the tests */
    this.symbolRegistry.save('env', process.env)

    /* save data if any */
    if (this.testSuite.data !== undefined) {
      this.saveData(this.testSuite.data)
    }

    debugService.print('symbol registry: ' + this.symbolRegistry.dump())
    const stats: RunStats = {
      total: 0,
      failed: 0,
      successful: 0,
      skipped: 0,
      durationSeconds: 0,
      durationMs: 0,
    }
    const hrstart = process.hrtime()

    try {
      await this.setup()
      if (this.testSuite.tests !== undefined) {
        this.phase = TestRunnerPhase.TESTS
        cliService.info('running tests')
        /* assign an ID to each */
        this.genIds()

        let failFastTriggered = false
        for (const test of this.testSuite.tests) {
          if (failFastTriggered && this.runResults[test.name] === undefined) {
            /* we've already failed and --fail-fast is on, just skip the test */
            await this.skipTest(test, 'fail fast')
            break
          }

          /* skip test if a selection of tests was provided */
          if (this.selectedTests !== undefined && !this.selectedTests.includes(test.name)) {
            this.skippedTests++
            this.runResults[test.name] = TestResult.SKIPPED
            continue
          }

          const testResult = await this.runTest(test)
          if (configService.isFailfast() && testResult === TestResult.FAILED) {
            /* test failed and --fail-fast option enabled, bail out now */
            cliService.info('the test failed and the --fail-fast option is enabled; bailing out.')
            failFastTriggered = true
          }
        }
      }
    } finally {
      /* do this before cleanup since cleanup could fail even more tests */
      if (this.testSuite.tests !== undefined) {
        stats.total = this.testSuite.tests.length
      }
      stats.failed = this.failedTests
      stats.skipped = this.skippedTests
      try {
        await this.cleanup()
      } catch (error) {
        cliService.error(`error during cleanup: ${error.message}`)
      }

      const hrend = process.hrtime(hrstart)
      const duration = getDuration(hrend[0])
      cliService.info(`Total tests: ${chalk.blueBright(stats.total)}`)
      let failedStr = '0'
      if (stats.failed > 0) {
        failedStr = chalk.red(stats.failed)
      }
      stats.successful = stats.total - stats.failed - stats.skipped
      cliService.info(`Successful tests: ${chalk.greenBright(stats.successful)}`)
      cliService.info(`Failed tests: ${failedStr}`)
      cliService.info(`Skipped tests: ${stats.skipped}`)
      cliService.info(`Duration: ${formatDuration(duration, hrend[1] / 1000000)}`)
    }
    return stats
  }

  static async runFile(file: string, driver: Driver, options: RunFileOptions): Promise<RunStats> {
    cliService.h1(`running file ${file}`)
    const testRunner = new TestRunner(driver)
    testRunner.load(file)
    if (options.selected !== undefined) {
      cliService.info(`running only these tests: ${options.selected}`)
      testRunner.selectTests(options.selected)
    }
    if (options.excluded !== undefined) {
      cliService.info(`excluding tests ${options.excluded}`)
      testRunner.excludeTests(options.excluded)
    }

    return testRunner.run()
  }
}

