import {TestPayload} from './test-payload'
import {Assertion} from './assertion'

export enum TestKind {
  SETUP = 'setup',
  TEST = 'test',
  CLEANUP = 'cleanup'
}

export interface Test {
  id: number;
  name: string;
  kind: TestKind;
  payload: TestPayload;
  repeat?: boolean;
  until?: { [key: string]: Assertion };
  max_count?: any;
  delay_between_iterations?: number;
  save?: { [key: string]: string };
  dependencies?: Array<string> | string;
  assert: { [key: string]: Assertion };
  if?: { [key: string]: Assertion };
}
