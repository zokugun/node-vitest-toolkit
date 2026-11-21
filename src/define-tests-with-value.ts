import type { MaybePromise } from './types.js';
import type { RawOptions } from './raw/define-raw-tests.js';

import process from 'node:process';
import YAML from 'yaml';

import { defineRawTests } from './raw/define-raw-tests.js';

type Options = RawOptions;

const DEBUG = process.env.DEBUG === '1' || process.env.DEBUG === 'true' || process.env.DEBUG === 'on';

export async function defineTestsWithValue<Manifest extends Record<string, unknown>, Value = unknown>(
	action: (manifest: Manifest) => MaybePromise<Value>,
	assert: (value: Value, manifest: Manifest) => MaybePromise<void>,
	options: Options = {}
): Promise<void> {
	await defineRawTests<Manifest>(async (manifest) => {
		const value = await action(manifest);

		try {
			assert(value, manifest);
		}
		catch(error) {
			if(DEBUG) {
				console.log(YAML.stringify(value));
			}

			throw error;
		}
	}, options);
}
