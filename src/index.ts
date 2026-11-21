import { extendMatchers } from './matchers/index.js';

extendMatchers();

export * from '@zokugun/is-it-type';
export { vol } from 'memfs';
export * as YAML from 'yaml';

export * as mocks from './mocks/index.js';
export { defineGroupedTests } from './define-grouped-tests.js';
export { defineTestsWithCommand } from './define-tests-with-command.js';
export { defineTestsWithExec } from './define-tests-with-exec.js';
export { defineTestsWithFiles } from './define-tests-with-files.js';
export { defineTestsWithInMemoryFiles } from './define-tests-with-in-memory-files.js';
export { defineTestsWithResult } from './define-tests-with-result.js';
export { defineTestsWithValue } from './define-tests-with-value.js';
export { mockForInMemoryFiles, unmockForInMemoryFiles } from './mock-for-in-memory-files.js';
export { makeTempDir } from './temp/make-temp-dir.js';
export { withTemp } from './temp/with-temp.js';

declare global {
	namespace Chai {
		// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
		interface Assertion {
			toExitWith(expectedExitCode: number | null): Assertion;
			toFail(): Assertion;
			toSucceed(): Assertion;
			toHaveStdout(expected: string | RegExp): Assertion;
			toHaveStderr(expected: string | RegExp): Assertion;
		}
	}
}
