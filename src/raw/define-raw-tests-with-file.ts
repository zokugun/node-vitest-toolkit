import type { MaybePromise } from '#/types.js';
import type { RawOptions } from './define-raw-tests.js';

import fse from '@zokugun/fs-extra-plus/async';
import { isString } from '@zokugun/is-it-type';
import process from 'node:process';

import { withTemp } from '#/temp/with-temp.js';
import { defineRawTests } from './define-raw-tests.js';

export type ExpectedFiles = Record<string, string | { error: string }>

export type Options = RawOptions & {
	input?: string;
	output?: string;
	transformFile?: (type: 'additional' | 'input' | 'output', path: string, content: string) => string;
};

const DEBUG = process.env.DEBUG === '1' || process.env.DEBUG === 'true' || process.env.DEBUG === 'on';
const FILE_REGEX = /^([/\\])([^/\\]+)\1(.*)$/;

export async function defineRawTestWithFiles(
	action: (manifest: Record<string, unknown>, workingDirectory: string, expectedFiles: ExpectedFiles, debug: boolean) => MaybePromise<void>,
	options: Options = {}
): Promise<void> {
	const {
		input = 'input',
		output = 'output',
		transformFile = (_type, _path, content) => content,
		...rawOptions
	} = options;

	await defineRawTests(async (manifest) => {
		await withTemp(async (workingDirectory) => {
			const expectedFiles: ExpectedFiles = {};

			for(const [key, data] of Object.entries(manifest)) {
				const match = FILE_REGEX.exec(key);

				if(match) {
					const [,, directory, path] = match;

					if(directory === input) {
						const result = await fse.outputFile(fse.join(workingDirectory, path), transformFile('input', path, data as string), 'utf8');

						if(result.fails) {
							throw result.error;
						}
					}
					else if(directory === output) {
						if(isString(data)) {
							expectedFiles[path] = transformFile('output', path, data)
						}
						else {
							expectedFiles[path] = data as { error: string };
						}
					}
				}
			}

			await action(manifest, workingDirectory, expectedFiles, DEBUG);
		});
	}, rawOptions)
}
