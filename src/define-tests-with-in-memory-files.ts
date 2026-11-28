import type { MaybePromise } from './types.js';
import type { RawOptions } from './raw/define-raw-tests.js';

import { isString } from '@zokugun/is-it-type';
import { stringifyError, xtryAsync } from '@zokugun/xtry';
import { vol } from 'memfs';
import process from 'node:process';
import { expect } from 'vitest';

import { defineRawTests } from './raw/define-raw-tests.js';

type Options = RawOptions & {
	additionals?: string[];
	input?: string;
	output?: string;
	transformFile?: (type: 'additional' | 'input' | 'output', path: string, content: string) => string
};

const DEBUG = process.env.DEBUG === '1' || process.env.DEBUG === 'true' || process.env.DEBUG === 'on';
const DEBUG_VOL = process.env.DEBUG === 'vol';

export async function defineTestsWithInMemoryFiles(action: (manifest: Record<string, unknown>) => MaybePromise<void>, options: Options = {}): Promise<void> {
	const {
		additionals = [],
		input = 'input',
		output = 'output',
		transformFile = (_type, _path, content) => content,
		...rawOptions
	} = options;

	await defineRawTests(async (manifest) => {
		const fromJSON = {};
		const expectedFiles: Record<string, string | { error: string }> = {};

		for(const [key, data] of Object.entries(manifest)) {
			if(key.startsWith('/')) {
				const directory = key.slice(1, key.indexOf('/', 1));
				const slicing = directory.length + 2;

				if(directory === input) {
					const path = key.slice(slicing);

					fromJSON[`/working/${path}`] = transformFile('input', path, data as string);
				}
				else if(directory === output) {
					const path = key.slice(slicing);

					if(isString(data)) {
						expectedFiles[path] = transformFile('output', path, data)
					}
					else {
						expectedFiles[path] = data as { error: string };
					}
				}
				else {
					for(const input of additionals) {
						if(directory === input) {
							fromJSON[key] = transformFile('additional', key, data as string);

							break;
						}
					}
				}
			}
		}

		if(isString(manifest.error)) {
			const { error } = manifest;

			vol.fromJSON(fromJSON);

			await expect(action(manifest)).rejects.toThrow(error);
		}
		else {
			vol.fromJSON(fromJSON);

			if(DEBUG_VOL) {
				console.log(vol.toJSON());
			}

			await action(manifest);

			if(DEBUG_VOL) {
				console.log(vol.toJSON());
			}

			for(const [file, data] of Object.entries(expectedFiles)) {
				const content = vol.promises.readFile(`/working/${file}`, 'utf8');

				if(isString(data)) {
					const result = await xtryAsync(content, stringifyError);

					if(DEBUG && result.fails) {
						console.log(`Expecting file at "${file}"`);
					}

					if(DEBUG && result.value !== data) {
						console.log(result)
					}

					expect(result.fails).to.be.false;
					expect(result.value).to.eql(data);
				}
				else {
					await expect(content).rejects.toThrow(`${data.error}, open '/working/${file}'`);
				}
			}
		}
	}, rawOptions);
}
