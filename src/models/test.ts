import {TestPayload} from './test-payload'
import {Assertion} from './assertion'

export interface Test {
  name: string;
  payload: TestPayload;
  save?: { [key: string]: string };
  dependencies?: Array<string>;
  assert: { [key: string]: Assertion };
}
