@cloudsdk/test-runner
=====================

Cloud SDK Test Runner

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@cloudsdk/test-runner.svg)](https://npmjs.org/package/@cloudsdk/test-runner)
[![Downloads/week](https://img.shields.io/npm/dw/@cloudsdk/test-runner.svg)](https://npmjs.org/package/@cloudsdk/test-runner)
[![License](https://img.shields.io/npm/l/@cloudsdk/test-runner.svg)](https://github.com///blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @cloudsdk/test-runner
$ csdk-test-runner COMMAND
running command...
$ csdk-test-runner (-v|--version|version)
@cloudsdk/test-runner/1.10.0-beta.1 darwin-x64 node-v14.15.0
$ csdk-test-runner --help [COMMAND]
USAGE
  $ csdk-test-runner COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`csdk-test-runner help [COMMAND]`](#csdk-test-runner-help-command)
* [`csdk-test-runner run [FILE]`](#csdk-test-runner-run-file)

## `csdk-test-runner help [COMMAND]`

display help for csdk-test-runner

```
USAGE
  $ csdk-test-runner help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

## `csdk-test-runner run [FILE]`

Runs a test suite from a JSON test specification.

```
USAGE
  $ csdk-test-runner run [FILE]

OPTIONS
  -b, --batch                consider the input a batch, meaning it lists a batch of independent tests
  -d, --driver=driver        language driver to use; path and args are taken from config
  -f, --fail-fast            exit with failure as soon as a test fails
  -h, --help                 show CLI help
  -t, --test=test            run only the specified tests; use -t multiple times to specify more than 1 test
  -x, --exclude=exclude      exclude tests
  --debug                    show debugging information: verbose + displays each driver command's input and output
  --driver-arg=driver-arg    command line arguments to pass to driver; must be specified together with "driver-path"
  --driver-cwd=driver-cwd    working directory to run the driver command in
  --driver-path=driver-path  driver path to use; cannot be specified together with "driver"
  --verbose                  show each assertion evaluation

EXAMPLE
  $ csdk-test-runner run
```
<!-- commandsstop -->
