@ionos-cloud/test-runner
=====================

Cloud SDK Test Runner

![CI](https://github.com/ionos-cloud/sdk-test-runner/workflows/CI/badge.svg)
[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)

<!-- toc -->
* [Installing via npm](#installing-via-npm)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Installing via npm

1. Generate a Github Personal Access Token. Check the [Github Documentation](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token)
   on how to do that.
2. Add the following lines to your ~/.npmrc file:
```
@ionos-cloud:registry=https://npm.pkg.github.com/ionos-cloud
//npm.pkg.github.com/:_authToken=<YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>
```
3. Install the package
```shell
npm install -g @ionos-cloud/test-runner
```
You can also check the [Github documentation](https://docs.github.com/en/free-pro-team@latest/packages/guides/configuring-npm-for-use-with-github-packages) on how to access github npm packages.
# Usage
<!-- usage -->
```sh-session
$ npm install -g @ionos-cloud/test-runner
$ csdk-test-runner COMMAND
running command...
$ csdk-test-runner (-v|--version|version)
@ionos-cloud/test-runner/1.11.1 darwin-x64 node-v15.4.0
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

_See code: [src/commands/run.ts](https://github.com/ionos-cloud/sdk-test-runner/blob/v1.11.1/src/commands/run.ts)_
<!-- commandsstop -->
