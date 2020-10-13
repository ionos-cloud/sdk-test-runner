import {TestSuite} from '../models/test-suite'
import {Test} from '../models/test'

import {readFileSync} from 'fs'
import {TestPayload} from '../models/test-payload'

import {SymbolRegistry} from './symbol-registry'

import execa from 'execa'
import {evalAssertion} from '../models/assertion'
import cliService from '../services/cli.service'

import Listr = require('listr')
import {ListrContext, ListrTask, ListrTaskWrapper} from 'listr'

import chalk from 'chalk'
import debugService from './buffered-debug.service'

export enum TestResult {
  SUCCESS,
  FAILED,
  SKIPPED
}

export class TestRunner {
  protected testSuite: TestSuite = {
    tests: [],
  }

  protected runResults: {[key: string]: TestResult} = {}

  protected commandError: {[key: string]: boolean} = {}

  protected symbolRegistry: SymbolRegistry

  protected command: string

  protected args: string[]

  protected failedTests = 0

  protected skippedTests = 0

  protected selectedTests: string[] | undefined = undefined

  protected excludedTests: string[] = []

  protected debug = false

  protected verbose = false

  constructor(command: string, args: string[]) {
    this.command = command
    this.args = args
    this.symbolRegistry = new SymbolRegistry()
  }

  public setDebug(d: boolean): this {
    this.debug = d
    return this
  }

  public setVerbose(v: boolean): this {
    this.verbose = v
    return this
  }

  protected logDebug(msg: string) {
    if (this.debug) {
      /* we need to save this in a buffer and flush it after Listr finishes, otherwise
       * Listr's output will overwrite whatever all our logs if we use a tty */
      debugService.log(msg)
    }
  }

  /* directly print a debug message - careful: the text will be erased by Listr output if used in
   * the middle of a Listr task */
  protected printDebug(msg: any) {
    if (this.debug) {
      cliService.debug(msg)
    }
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
    if (typeof this.testSuite.cleanup === 'undefined') return
    cliService.info('running cleanup tests')
    for (const test of this.testSuite.cleanup) {
      // eslint-disable-next-line no-await-in-loop
      await this.runTest(test)
    }
  }

  protected async runDeps(test: Test): Promise<TestResult> {
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
            title: `TEST: ${test.name}`,
            task: () => {
              throw new Error(`dependency '${depTest.name}' failed to run`)
            },
          },
        ], {concurrent: false, exitOnError: false})
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
          // eslint-disable-next-line no-await-in-loop
          await new Listr([
            {
              title: `TEST: ${test.name}`,
              task: () => '',
              skip: () => `dependency '${depTest.name}' ${reason}`,
            },
          ], {concurrent: false, exitOnError: false}).run()
        } catch (error) {
          cliService.error(error.message)
        }
        return this.runResults[test.name]
      }
    }
    return TestResult.SUCCESS
  }

  protected async checkExcluded(test: Test): Promise<boolean> {
    if (!this.excludedTests.includes(test.name)) {
      return false
    }
    /* skip this test */
    /* display it for the user to know */
    const mainTask = new Listr([
      {
        title: `TEST: ${test.name}`,
        skip: () => true,
        task: () => '',
      },
    ], {concurrent: false, exitOnError: false})

    // eslint-disable-next-line max-depth

    // eslint-disable-next-line no-await-in-loop
    await mainTask.run()

    this.skippedTests++
    this.runResults[test.name] = TestResult.SKIPPED
    return true
  }

  protected buildDriverSubtask(test: Test): ListrTask<ListrContext>[] {
    return [
      {
        title: 'running driver command',
        task: async (ctx: any, _: ListrTaskWrapper) => {
          /* run command */
          let result = null
          try {
            result = await this.runCommand(this.replaceSymbolsInObj(test.payload))
            this.commandError[test.name] = false
          } catch (error) {
            this.logDebug(`command error: ${error}`)
            this.commandError[test.name] = true
            ctx.commandFailure = true
            throw error
          }

          /* save data into symbol registry */
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
        },
      },
    ]
  }

  protected buildAssertionsSubtasks(test: Test): { subtasks: ListrTask<ListrContext>[]; collapse: boolean} {
    let collapse = true
    const subtasks: ListrTask<ListrContext>[] = []
    if (typeof test.assert === 'undefined') {
      return {subtasks, collapse}
    }
    for (const symbol of Object.keys(test.assert)) {
      if (test.assert[symbol].print !== undefined) {
        /* we want to keep the tests open if we have a print inside them, to keep the message visible */
        collapse = false
      }
      subtasks.push(
        {
          title: `evaluating '${symbol}'`,
          task: (ctx: any, task: ListrTaskWrapper) => {
            const value = this.replaceSymbolsInObj(this.symbolRegistry.get(`${this.replaceSymbols(symbol)}`))
            task.title += ` = ${JSON.stringify(value)}`
            return evalAssertion(value, this.replaceSymbolsInObj(test.assert[symbol]))
          },
          skip: ctx => ctx.commandFailure ? 'driver command failed' : false,
        }
      )
    }
    return {subtasks, collapse}
  }

  protected buildCleanupSubtasks(): ListrTask<ListrContext>[] {
    return [{
      title: 'cleaning up command results',
      task: async ctx => {
        /* remove command output from registry to make room for the next test */
        for (const resultKey of Object.keys(ctx.resultObj)) {
          this.symbolRegistry.del(resultKey)
        }
      },
      skip: ctx => ctx.commandFailure ? 'driver command failed' : false,
    }]
  }

  protected buildMainTask(test: Test): Listr {
    const assertionSubtasks = this.buildAssertionsSubtasks(test)
    const subtasks = [
      ...this.buildDriverSubtask(test),
      ...assertionSubtasks.subtasks,
      ...this.buildCleanupSubtasks(),
    ]
    return new Listr([
      {
        title: `TEST: ${test.name}`,
        task: () => new Listr(subtasks, {concurrent: false, exitOnError: false}),
      },

      // @ts-ignore
    ], {concurrent: false, exitOnError: false, collapse: assertionSubtasks.collapse && !this.verbose && !this.debug})
  }

  /* todo: returning a TestResult and also using this.runResults is a bit wonky */
  public async runTest(test: Test): Promise<TestResult> {
    let ret = TestResult.SUCCESS

    if (this.runResults[test.name] !== undefined) {
      /* test already ran */
      return this.runResults[test.name]
    }

    /* check if the test was excluded from the run-set */
    if (await this.checkExcluded(test)) {
      return this.runResults[test.name]
    }

    /* solve dependencies */
    const depsResult = await this.runDeps(test)
    if (depsResult !== TestResult.SUCCESS) {
      /* deps failed or were skipped */
      return depsResult
    }

    try {
      await this.buildMainTask(test).run()
    } catch (error) {
      if (typeof error.errors !== 'undefined') {
        /* mark test as failed */
        this.failedTests++
        ret = TestResult.FAILED
      }
    } finally {
      debugService.flush()
    }

    this.runResults[test.name] = ret
    return ret
  }

  // eslint-disable-next-line no-warning-comments
  /* todo implement timeout */
  protected async runCommand(payload: TestPayload): Promise<string> {
    try {
      const input = JSON.stringify(payload)
      this.logDebug(`${chalk.yellow('driver input')}: ${input}`)
      const subprocess = execa(this.command, this.args, {input})
      const out = await subprocess
      this.logDebug(`${chalk.yellow('driver output')}: ${out.stdout}`)
      this.logDebug(`${chalk.yellow('driver stderr')}: ${out.stderr}`)
      return out.stdout
    } catch (error) {
      this.logDebug(`${chalk.yellowBright('driver error')}: ${error.message}`)
      throw new Error(`Error running command ${this.command}: ${error.message}`)
    }
  }

  public findTest(name: string): Test | undefined {
    return this.testSuite.tests?.find((t: Test) => t.name === name)
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
    for (const inc of testSuite.include) {
      let content: Buffer
      try {
        content = readFileSync(inc)
      } catch (error) {
        throw new Error(`Error reading file ${inc}: ${error.message}`)
      }
      const subTestSuite = this.loadTestSuite(content.toString())
      if (subTestSuite.tests !== undefined) {
        testSuite.tests.unshift(...subTestSuite.tests)
      }
      if (subTestSuite.setup !== undefined) {
        if (testSuite.setup === undefined) {
          testSuite.setup = []
        }
        testSuite.setup?.unshift(...subTestSuite.setup)
      }

      if (subTestSuite.cleanup !== undefined) {
        if (testSuite.cleanup === undefined) {
          testSuite.cleanup = []
        }
        testSuite.cleanup?.unshift(...subTestSuite.cleanup)
      }

      if (subTestSuite.data !== undefined) {
        if (testSuite.data === undefined) {
          testSuite.data = {
            ...subTestSuite.data,
          }
        } else {
          testSuite.data = {
            ...subTestSuite.data,
            ...testSuite.data,
          }
        }
      }
    }

    return testSuite
  }

  public load(fileName: string): TestRunner {
    let content: Buffer
    try {
      content = readFileSync(fileName)
    } catch (error) {
      throw new Error(`Error reading file ${fileName}: ${error.message}`)
    }
    this.testSuite = this.loadTestSuite(content.toString())
    return this
  }

  protected saveData(data: {[key: string]: any}) {
    const processedData: {[key: string]: any} = {}
    for (const key of Object.keys(data)) {
      /* not replacing symbols in data[key] here to allow this to happen
       * later on, after this data is saved in the registry, otherwise we would get
       * undefined now */
      processedData[this.replaceSymbols(key)] = data[key]
    }
    this.symbolRegistry.save('data', processedData)
  }

  public async run() {
    this.runResults = {}
    this.commandError = {}

    this.symbolRegistry.clear()

    /* saving environment to be accessible in the tests */
    this.symbolRegistry.save('env', process.env)

    /* save data if any */
    if (this.testSuite.data !== undefined) {
      this.saveData(this.testSuite.data)
    }

    this.printDebug('symbol registry: ' + this.symbolRegistry.dump())

    try {
      await this.setup()
      if (this.testSuite.tests !== undefined) {
        for (const test of this.testSuite.tests) {
          if (this.selectedTests === undefined || this.selectedTests.includes(test.name)) {
            // eslint-disable-next-line no-await-in-loop
            await this.runTest(test)
          } else {
            this.skippedTests++
          }
        }
      }
    } finally {
      /* do this before cleanup since cleanup could fail even more tests */
      let totalN = 0
      if (this.testSuite.tests !== undefined) {
        totalN = this.testSuite.tests.length
      }
      const failedN = this.failedTests
      const skippedN = this.skippedTests
      try {
        await this.cleanup()
      } catch (error) {}
      cliService.info(`Total tests: ${chalk.blueBright(totalN)}`)
      let failedStr = '0'
      if (failedN > 0) {
        failedStr = chalk.red(failedN)
      }
      const successful = totalN - failedN - skippedN
      cliService.info(`Successful tests: ${chalk.greenBright(successful)}`)
      cliService.info(`Failed tests: ${failedStr}`)
      cliService.info(`Skipped tests: ${skippedN}`)
    }
  }

  protected replaceSymbols(str: string): string | number {
    let ret: string = str
    let found = false
    let isNumber = false
    do {
      found = false
      const tokens = ret.match(/\${[a-zA-Z0-9_/!@#%^&*()\s|.[\]-]+}/)
      if (tokens !== null && Array.isArray(tokens)) {
        found = true
        for (const token of tokens) {
          let symbol = token.substring(2, token.length - 1)
          if (symbol.includes('|')) {
            /* we have a filter */
            const [symbolName, filterName] = symbol.split('|').map(x => x.trim())
            symbol = symbolName
            if (filterName.toLowerCase() === 'number') {
              isNumber = true
            } else {
              throw new Error(`unknown filter ${filterName}`)
            }
          }
          ret = ret.replace(token, this.symbolRegistry.get(symbol))
        }
      }
    } while (found)

    if (isNumber) {
      return Number(ret)
    }

    return ret
  }

  protected replaceSymbolsInObj(obj: any): any {
    if (typeof obj === 'string') return this.replaceSymbols(obj)

    if (typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return (obj as Array<any>).map(el => this.replaceSymbolsInObj(el))
    }

    const ret: {[key: string]: any} = {}

    for (const key of Object.keys(obj)) {
      ret[this.replaceSymbols(key)] = this.replaceSymbolsInObj(obj[key])
    }

    return ret
  }
}

