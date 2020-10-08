import * as Assertions from '../assertions'

import Listr = require('listr')

export interface Assertion {
  null?: boolean;
  eq?: any;
  gt?: number | string;
  gte?: number | string;
  lt?: number | string;
  lte?: number | string;
  len?: number | string;
  lengte?: number | string;
  lenlte?: number | string;
  and?: Array<Assertion>;
  or?: Array<Assertion>;
  contains?: string | {[key: string]: any} | Array<any>;
  matches?: string;
  print?: string;
}

export type AssertionFunc = (ctx: any, task: any, value: any, condition: any) => void;
const assertionRegistry: {[key: string]: AssertionFunc} = {
  null: Assertions.isNull,
  eq: Assertions.eq,
  gt: Assertions.gt,
  gte: Assertions.gte,
  lt: Assertions.lt,
  lte: Assertions.lte,
  len: Assertions.len,
  lengte: Assertions.lengte,
  lenlte: Assertions.lenlte,
  contains: Assertions.contains,
  print: Assertions.print,
  matches: Assertions.matches,
}

export function evalAssertion(value: any, assertion: Assertion): Listr {
  const subtasks = []

  for (const key of Object.keys(assertion)) {
    subtasks.push({
      title: `${key}`,
      task: async (ctx: any, task: any) => {
        const assertFunc = assertionRegistry[key]
        // @ts-ignore
        const expected = assertion[key]
        if (assertFunc === null) {
          throw new Error(`assertion type '${key}' is unknown`)
        }
        await assertFunc(ctx, task, value, expected)
      },
    })
  }

  return new Listr(subtasks, {concurrent: false, exitOnError: false})
}
