export function print(ctx: any, task: any, value: any, condition: any) {
  task.title = `[debug] ${condition}` + JSON.stringify(value)
}

