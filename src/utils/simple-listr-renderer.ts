import cliService from '../services/cli.service'

export class SimpleListrRenderer {
  protected _tasks: any[] = []

  protected _options: {[key: string]: any} = {}

  constructor(tasks: any, options: any) {
    this._tasks = tasks
    this._options = Object.assign({
      dateFormat: 'HH:mm:ss',
    }, options)
  }

  static get nonTTY() {
    return true
  }

  displayFailedSubtasks(task: any) {
    cliService.indent()
    for (const subtask of task.subtasks) {
      if (subtask.hasFailed()) {
        cliService.print(`✖ ${subtask.title} [failed]`)
        if (subtask.hasSubtasks()) {
          this.displayFailedSubtasks(subtask)
        } else {
          cliService.indent()
          cliService.print(`→ ${subtask.output}`)
          cliService.outdent()
        }
      }
    }
    cliService.outdent()
  }

  render() {
    for (const task of this._tasks) {
      task.subscribe(
        (event: any) => {
          switch (event.type) {
          case 'STATE':
            if ((task.state === 'pending' || task.state === 'completed' || task.hasFailed() || task.isSkipped()) && (task.title.startsWith('TEST'))) {
              if (task.isPending() && !task.isStopped) {
                cliService.info(`${task.title} [started]`)
              } else {
                cliService.info(`${task.title} [${task.state}]`)
              }
              if (task.isSkipped()) {
                /* display reason for skipping */
                cliService.indent()
                cliService.print('→ reason: ' + task.output)
                cliService.outdent()
              }
              if (task.hasFailed() && task.hasSubtasks()) {
                /* display all failed subtasks */
                this.displayFailedSubtasks(task)
              }
            }
            break
          }
        },
        (err: Error) => {
          cliService.error(err.message)
        }
      )
    }
  }

  end() {
    return null
  }
}

