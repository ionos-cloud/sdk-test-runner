import {TestPayload} from './test-payload'
import {Assertion} from './assertion'

export interface Test {
  name: string;
  payload: TestPayload;
  repeat?: boolean;
  until?: { [key: string]: Assertion };
  max_count?: any;
  delay_between_iterations?: number;
  save?: { [key: string]: string };
  dependencies?: Array<string> | string;
  assert: { [key: string]: Assertion };
}
