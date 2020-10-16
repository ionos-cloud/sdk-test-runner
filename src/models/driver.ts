export interface Driver {
  name: string;
  command: string;
  args: string[];
  cwd?: string;
}
