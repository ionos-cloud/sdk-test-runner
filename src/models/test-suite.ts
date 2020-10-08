import {Test} from './test'
import {resolve} from 'path'

import * as TJS from 'typescript-json-schema'

// import Ajv from 'Ajv'

export interface TestSuite {
  include?: Array<string>;
  setup?: Array<Test>;
  cleanup?: Array<Test>;
  data?: {[key: string]: any};
  tests?: Array<Test>;
}

// optionally pass argument to schema generator
const settings: TJS.PartialArgs = {
  required: true,
}

// optionally pass ts compiler options
const compilerOptions: TJS.CompilerOptions = {
  strictNullChecks: true,
}

// optionally pass a base path

const program = TJS.getProgramFromFiles(
  [resolve('./test-suite.ts')],
  compilerOptions
)

// We can either get the schema for one file and one type...
export const TestSuiteSchema: TJS.Definition | null = TJS.generateSchema(program, 'TestSuite', settings)
TestSuiteSchema?.$schema
/**
 * Loads a test suite from a json spec and resolve all includes
 * setup and cleanup tests are loaded in the order of the includes and come before local setup and cleanup tests
 *
 * @param {string} spec JSON spec
 *
 * @return {TestSuite} test suite
 */
