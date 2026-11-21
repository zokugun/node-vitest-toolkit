import type { Result } from '@zokugun/xtry';
import type { MaybePromise } from './types.js';
import type { RawOptions } from './raw/define-raw-tests.js';

import { isString } from '@zokugun/is-it-type';
import { stringifyError } from '@zokugun/xtry';
import process from 'node:process';
import { expect } from 'vitest';
import YAML from 'yaml';

import { defineRawTests } from './raw/define-raw-tests.js';

type Options<Manifest> = RawOptions & {
	assertFailure?: ((error: unknown, manifest: Manifest) => MaybePromise<void>)
};

const DEBUG = process.env.DEBUG === '1' || process.env.DEBUG === 'true' || process.env.DEBUG === 'on';

export async function defineTestsWithResult<Manifest extends Record<string, unknown>, Value = unknown>(
	action: (manifest: Manifest) => MaybePromise<Result<Value, unknown>>,
	assertSuccess: (value: Value, manifest: Manifest) => MaybePromise<void>,
	options: Options<Manifest> = {}
): Promise<void> {
	await defineRawTests<Manifest>(async (manifest) => {
		const result = await action(manifest);

		if(isString(manifest.error)) {
			const { error } = manifest;

			try {
				expect(result).toFail();

				if(options.assertFailure) {
					await options.assertFailure(result.error, manifest);
				}
				else {
					if(isString(result.error)) {
						expect(result.error).to.eql(error);
					}
					else {
						expect(stringifyError(result.error)).to.eql(error);
					}
				}
			}
			catch (error) {
				if(DEBUG) {
					console.log(stringifyError(result.error));
				}

				throw error;
			}
		}
		else {
			try {
				expect(result).toSucceed();

				assertSuccess(result.value!, manifest);
			}
			catch (error) {
				if(DEBUG) {
					console.log(YAML.stringify(result));
				}

				throw error;
			}
		}
	}, options);
}
