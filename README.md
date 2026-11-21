[@zokugun/vitest-toolkit](https://github.com/zokugun/node-vitest-toolkit)
=========================================================================

[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@zokugun/vitest-toolkit?color=brightgreen)](https://www.npmjs.com/package/@zokugun/vitest-toolkit)
[![NodeJS Version](https://img.shields.io/badge/node.js-%3E%3D%2018.20-green)](#requirements)
[![Modules](https://img.shields.io/badge/modules-ESM-green)](#requirements)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-f87171?logo=kofi&logoColor=white)](https://ko-fi.com/daiyam)
[![Liberapay](https://img.shields.io/badge/Liberapay-facc15?logo=liberapay&logoColor=black)](https://liberapay.com/daiyam/donate)
[![PayPal](https://img.shields.io/badge/PayPal-5277C3?logo=paypal&logoColor=white)](https://paypal.me/daiyam99)

> This toolkit provides utilities for vitest

Features
--------

- **YAML Fixtures**: Generate tests automatically from external configuration files.
- **Virtual Filesystem**: Use in-memory storage to avoid slow disk I/O.
- **Output Validation**: Compare resulting file content against expected values.
- **Error Testing**: Verify that specific error messages are thrown as defined.

Installation
------------

```bash
npm add @zokugun/vitest-toolkit
```

Requirements
------------

- **Node.js**: `v18.20` or higher
- **Modules**: ECMAScript Modules (`ESM`)

Quick Start
-----------

API Reference
-------------

### Functions

The fixture-based test helpers read YAML files from `test/fixtures/`. Use `fixture` to select a subdirectory. The shared `FixtureOptions` shown below represents the fixture selection, timeout, and validation options accepted by these helpers.

#### defineGroupedTests

Creates a Vitest `describe` group for each YAML fixture. Each fixture must contain an array of manifest objects; each object generates an individual test.

```typescript
function defineGroupedTests<Manifest extends Record<string, unknown>>(
  action: (manifest: Manifest) => MaybePromise<void>,
  options?: {
    fixture?: (basename: string) => boolean;
    groupName?: (basename: string) => string;
    testName?: (manifest: Manifest) => string;
  }
): Promise<void>;
```

By default, the group name is the fixture filename without its first extension, and each test name comes from `manifest.name`.

#### defineTestsWithValue

Runs an action for each fixture and passes its result and manifest to a test callback.

```typescript
function defineTestsWithValue<Manifest extends Record<string, unknown>, Value>(
  action: (manifest: Manifest) => MaybePromise<Value>,
  assert: (value: Value, manifest: Manifest) => MaybePromise<void>,
  options?: FixtureOptions
): Promise<void>;
```

#### defineTestsWithResult

Tests an action that returns a `Result`. A fixture with a top-level `error` string is expected to fail; otherwise, `assertSuccess` checks the successful value. Use `assertFailure` to customize failure assertions.

```typescript
function defineTestsWithResult<Manifest extends Record<string, unknown>, Value>(
  action: (manifest: Manifest) => MaybePromise<Result<Value, unknown>>,
  assertSuccess: (value: Value, manifest: Manifest) => MaybePromise<void>,
  options?: FixtureOptions & {
    assertFailure?: (error: unknown, manifest: Manifest) => MaybePromise<void>;
  }
): Promise<void>;
```

#### defineTestsWithFiles

Runs an action in a temporary working directory and checks expected files after it completes. Fixture keys use `/input/<path>` for input files and `/output/<path>` for expected output files. An output value can be `{ error: "..." }` to assert that the file is missing with that error.

```typescript
function defineTestsWithFiles(
  action: (manifest: Record<string, unknown>, root: string) => MaybePromise<void>,
  options?: FileFixtureOptions
): Promise<void>;
```

#### defineTestsWithExec

Runs an action in a temporary working directory and verifies its `ExecResult`. A fixture's top-level `error` string checks for a failed result and matching fatal output; `output` checks stdout; otherwise success and expected output files are checked.

```typescript
function defineTestsWithExec(
  action: (manifest: Record<string, unknown>, root: string) => MaybePromise<ExecResult | undefined>,
  options?: FileFixtureOptions & { stripAnsi?: boolean }
): Promise<void>;
```

#### defineTestsWithCommand

Runs a command for each fixture using `defineTestsWithExec`. The command receives the optional `name` followed by any string arguments in `manifest.args`, runs in the fixture's temporary directory, and gets stdin from `manifest.input`.

```typescript
function defineTestsWithCommand(
  command: Command,
  name: string | null | undefined,
  commandOptions?: Partial<CommandOptions>,
  options?: FileFixtureOptions & { stripAnsi?: boolean }
): Promise<void>;
```

`Command` and `CommandOptions` are provided by `@zokugun/exec-lite`. The file fixture options extend these common fixture options:

```typescript
type FixtureOptions = {
  fixture?: string;
  timeout?: number;
  validate?: (name: string, manifest: Record<string, unknown>) => boolean;
};

type FileFixtureOptions = FixtureOptions & {
  input?: string;
  output?: string;
  transformFile?: (
    type: 'additional' | 'input' | 'output',
    path: string,
    content: string
  ) => string;
};
```

#### defineTestsWithInMemoryFiles

Generates Vitest tests using an in-memory filesystem. Each YAML fixture maps to one test case.

```typescript
function defineTestsWithInMemoryFiles(
  action: (manifest: Record<string, unknown>) => MaybePromise<void>,
  options?: FixtureOptions & FileFixtureOptions & { additionals?: string[] }
): Promise<void>;
```

**Options:**

| Property | Type | Default | Description |
|---|---|---|---|
| `fixture` | `string` | `''` | Fixture directory name under `test/fixtures/` |
| `timeout` | `number` | — | Vitest test timeout |
| `validate` | `(name, manifest) => boolean` | `() => true` | Select fixtures to run |
| `input` | `string` | `'input'` | Key prefix for input files in YAML |
| `output` | `string` | `'output'` | Key prefix for expected output files in YAML |
| `additionals` | `string[]` | `[]` | Extra key prefixes to treat as input files |
| `transformFile` | `(type, path, content) => string` | identity | Transform file content before loading into the mock FS |

**YAML manifest format:**

```yaml
# Test name is derived from the .yml filename without its extension
/input/some-file.txt: "file contents"
/output/result.txt: "expected output"
error: "expected error message" # optional; if present, the test expects a throw
```

Input files are loaded into the in-memory filesystem at `/working/<path>`. Output keys are checked after `action()` runs. Additional input prefixes are loaded at their original virtual paths.

If the manifest contains a top-level `error` string, the test expects `action(manifest)` to reject with that message. Otherwise it checks output files exist and match expected content.

Set `DEBUG=1` or `DEBUG=vol` in your environment to log filesystem state before/after the action runs.

---

#### mockForInMemoryFiles / unmockForInMemoryFiles

Replaces real file system and process modules with an in-memory mock for testing CLI tools.

```typescript
function mockForInMemoryFiles(workingDirectory?: string): void;
function unmockForInMemoryFiles(): void;
```

`mockForInMemoryFiles()` swaps:
- `node:fs` / `node:fs/promises` → memfs-backed mock
- `node:process` → fake process with `cwd()` set to `workingDirectory` (default `/working`) and empty `env`
- `@zokugun/cli-utils` → stripped logger that swallows output, throws on `fatal`, logs to console when `DEBUG` is set

Call `mockForInMemoryFiles()` before your test suite and `unmockForInMemoryFiles()` after.

**Caveat:** These use `vi.doMock` / `vi.doUnmock`, which only affect modules loaded *after* the mock is set. If a module was already imported before calling `mockForInMemoryFiles()`, it won't be affected. Call these at the top of your test file or in `beforeEach`.

---

#### makeTempDir / withTemp

`makeTempDir()` creates and returns a temporary directory path.<br />
`withTemp()` runs an asynchronous callback in a temporary directory and removes it afterward, even if the callback fails.

```typescript
function makeTempDir(): Promise<string>;
function withTemp(run: (root: string) => Promise<void>): Promise<void>;
```

```typescript
await withTemp(async (root) => {
  // process.cwd() is root
});
```

---

#### Exec matchers

The package installs these Vitest/Chai matchers when imported:

| Matcher | Assertion |
|---|---|
| `toFail()` / `toSucceed()` | A `Result` is failed or successful |
| `toExitWith(code)` | An `ExecResult` has the given exit code (`number` or `null`) |
| `toHaveStdout(expected)` / `toHaveStderr(expected)` | Output contains a string or matches a regular expression |

### Mocks

#### mocks.memfs.fs

A drop-in replacement for Node's standard `fs` module, backed entirely by memory. Use it when you need manual control over the virtual filesystem.

#### mocks.stdin

Creates a readable stdin stream from a string or an array of strings. The tokens `<up>`, `<down>`, `<enter>`, and `<escape>` are encoded as terminal key sequences.

Contributions
-------------

Contributions are most welcome. Please:

- Open issues and feature requests under the repository discussions.
- Follow the [`CONTRIBUTING.md`](./CONTRIBUTING.md).

Donations
---------

Support this project by becoming a financial contributor.

<table>
   <tr>
      <td><img src="https://raw.githubusercontent.com/daiyam/assets/master/icons/256/funding_kofi.png" alt="Ko-fi" width="80px" height="80px"></td>
      <td><a href="https://ko-fi.com/daiyam" target="_blank">ko-fi.com/daiyam</a></td>
   </tr>
   <tr>
      <td><img src="https://raw.githubusercontent.com/daiyam/assets/master/icons/256/funding_liberapay.png" alt="Liberapay" width="80px" height="80px"></td>
      <td><a href="https://liberapay.com/daiyam/donate" target="_blank">liberapay.com/daiyam/donate</a></td>
   </tr>
   <tr>
      <td><img src="https://raw.githubusercontent.com/daiyam/assets/master/icons/256/funding_paypal.png" alt="PayPal" width="80px" height="80px"></td>
      <td><a href="https://paypal.me/daiyam99" target="_blank">paypal.me/daiyam99</a></td>
   </tr>
</table>

License
-------

Copyright &copy; 2026-present Baptiste Augrain

Licensed under the [MIT license](https://opensource.org/licenses/MIT).
