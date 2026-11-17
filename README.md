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

#### buildCliFileTests

Generates Vitest tests from YAML fixture files in a directory. Each file maps to one test case.

```typescript
function buildCliFileTests(
  action: (manifest: Record<string, unknown>) => unknown,
  options?: Options
): void;
```

**Options:**

| Property | Type | Default | Description |
|---|---|---|---|
| `fixture` | `string` | `''` | Fixture directory name under `test/fixtures/` |
| `input` | `string` | `'input'` | Key prefix for input files in YAML |
| `output` | `string` | `'output'` | Key prefix for expected output files in YAML |
| `additionals` | `string[]` | `[]` | Extra key prefixes to treat as input files |
| `transformFile` | `(type, path, content) => string` | identity | Transform file content before loading into the mock FS |

**YAML manifest format:**

```yaml
# Test name is derived from the .yml filename (first segment only)
input/some-file.txt: "file contents"
output/result.txt: "expected output"
error: "expected error message"  # optional, if present the test expects a throw
```

Paths starting with `/` are treated as virtual paths. The `input` and `additional` keys are loaded into an in-memory filesystem at `/working/<path>`. Output keys are checked after `action()` runs.

If the manifest contains a top-level `error` string, the test expects `action(manifest)` to reject with that message. Otherwise it checks output files exist and match expected content.

Set `DEBUG=1` or `DEBUG=vol` in your environment to log filesystem state before/after the action runs.

---

#### mockCliFileTests / unmockCliFileTests

Replaces real file system and process modules with an in-memory mock for testing CLI tools.

```typescript
function mockCliFileTests(): void;
function unmockCliFileTests(): void;
```

`mockCliFileTests()` swaps:
- `node:fs` / `node:fs/promises` → memfs-backed mock
- `node:process` → fake process with `cwd() === '/working'` and empty `env`
- `@zokugun/cli-utils` → stripped logger that swallows output, throws on `fatal`, logs to console when `DEBUG` is set

Call `mockCliFileTests()` before your test suite and `unmockCliFileTests()` after. Use them alongside `buildCliFileTests` for file-based CLI tests.

**Caveat:** These use `vi.doMock` / `vi.doUnmock`, which only affect modules loaded *after* the mock is set. If a module was already imported before calling `mockCliFileTests()`, it won't be affected. Call these at the top of your test file or in `beforeEach`.

---

#### withTemp

Runs a callback inside a temporary directory, then cleans up regardless of success or failure.

```typescript
function withTemp(
  prefix: string,
  run: (root: string) => Promise<void>
): Promise<void>;
```

Creates a temp dir with the given prefix, changes into it, runs `run(root)`, then changes back to the original working directory and removes the temp dir. Works even if `run()` throws — cleanup always happens.

**Example:**

```typescript
await withTemp('my-test-', async (root) => {
  // root is the path to the temp dir
  // process.chdir(root) was already called
});
// temp dir is gone now
```

### mocks.memfs.fs

A drop-in replacement for Node's standard `fs` module, backed entirely by memory. You can use this directly if you need manual control over the virtual filesystem without using the CLI test generators.

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
