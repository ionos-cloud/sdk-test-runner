export interface TestPayload {
  operation: string;
  env?: Record<string, string>;
  command?: string;
  args?: string[];
  params: Array<{[key: string]: any}>;
  options: {
    timeout: number;
  };
}
