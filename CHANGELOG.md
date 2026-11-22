Changelog
=========

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog][keepachangelog], and this project adheres to [Semantic Versioning][semver].

[v0.3.0] | 2026-11-22
---------------------

### Breaking

- mock utilities have been renamed/moved

### Added

- add the `respondToInteractiveProcess` function
- expose the `expandKeyTokens` function

[v0.2.0] | 2026-11-21
---------------------

### Breaking

- rename `buildCliFileTests` function as `defineTestsWithInMemoryFiles`

### Added

- the functions:
   - `defineGroupedTests`
   - `defineTestsWithCommand`
   - `defineTestsWithExec`
   - `defineTestsWithFiles`
   - `defineTestsWithResult`
   - `defineTestsWithValue`
- the matchers for `Result` and `ExecResult`
- the mock utilities for `memfs` and `stdin`

[v0.1.0] | 2026-11-17
---------------------

### Added

- initial release

[keepachangelog]: https://keepachangelog.com/en/2.0.0/
[semver]: https://semver.org/spec/v2.0.0.html
[unreleased]: https://github.com/zokugun/node-vitest-toolkit/compare/v0.3.0...HEAD
[v0.3.0]: https://github.com/zokugun/node-vitest-toolkit/releases/tag/v0.3.0
[v0.2.0]: https://github.com/zokugun/node-vitest-toolkit/releases/tag/v0.2.0
[v0.1.0]: https://github.com/zokugun/node-vitest-toolkit/releases/tag/v0.1.0
