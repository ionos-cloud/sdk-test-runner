export interface TestPayload {
  operation: string;
  params: Array<{[key: string]: any}>;
  options: {
    timeout: number;
  };
}
