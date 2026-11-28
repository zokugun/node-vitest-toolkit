import type { AsyncDResult, Result } from '@zokugun/xtry';
import type { RawOptions } from './raw/define-raw-tests.js';
import type { MaybePromise } from './types.js';

import { isString } from '@zokugun/is-it-type';
import { err, ok, stringifyError } from '@zokugun/xtry';
import { vol } from 'memfs';
import process from 'node:process';
import { expect, vi } from 'vitest';
import YAML from 'yaml';

import { defineRawTests } from './raw/define-raw-tests.js';
import { memfs } from './memfs.js';

const DEBUG = process.env.DEBUG === '1' || process.env.DEBUG === 'true' || process.env.DEBUG === 'on';
const DEBUG_VOL = process.env.DEBUG === 'vol';

type Options<Manifest> = RawOptions & {
	assertFailure?: ((error: unknown, manifest: Manifest) => MaybePromise<void>)
};
type Value = {
	code: number;
	commands: string[];
	output: string;
}

type Response = {
	command: string;
	output: string;
}


export async function defineTestsWithInMemoryCommand<Manifest extends Record<string, unknown>>(
	path: string,
	name: string,
	configure: (manifest: Manifest) => AsyncDResult<{
		responses: Response[][],
		args: unknown[],
	} | {
		response: Response,
		args: unknown[],
	}>,
	assertSuccess: (value: Value, manifest: Manifest) => MaybePromise<void>,
	options: Options<Manifest> = {}
): Promise<void> {
	await defineRawTests<Manifest>(async (manifest) => {
		let $execCommands: string[] = [];
		let $execIndex = 0;
		let $execResponses: Response[][] = [];
		let $exitCode: number | undefined;
		let $exitOutput: string[] = [];

		vi.resetModules();

		vi.doMock('node:fs', () => (
			{
				...memfs,
				default: memfs,
			}
		));
		vi.doMock('node:fs/promises', () => ({ default: memfs.promises }));

		vi.doMock('node:process', () => ({
			default: {
				cwd: () => '/working',
				env: {},
			},
		}));

		vi.doMock('@zokugun/cli-utils', async (importOriginal) => {
			const mod = await importOriginal() as any;
			const { logger } = mod as any;

			return {
				...mod,
				logger: {
					...logger,
					beginTimer: () => {},
					createSpinner: () => ({
						fail: () => {},
						succeed: () => {},
					}),
					debug: (message: string) => {
						if(DEBUG) {
							console.log(message);
						}

						$exitOutput.push(message);
					},
					error: (message: string) => {
						if(DEBUG) {
							console.log(message);
						}

						$exitOutput.push(message);
					},
					exit: (code: number = 0) => {
						$exitCode = code;
					},
					fatal: (message: string, code: number = 1) => {
						$exitCode = code;
						$exitOutput.push(message);

						throw new Error(message);
					},
					finishTimer: () => {},
					info: (message: string) => {
						if(DEBUG) {
							console.log(message);
						}

						$exitOutput.push(message);
					},
					newLine: () => {
						$exitOutput.push('');
					},
					print: (message: string) => {
						if(DEBUG) {
							console.log(message);
						}

						$exitOutput.push(message);
					},
				},
				exec: (command: string, args: string[]) => {
					let output = '';

					const commandline = [command, ...args].join(' ');

					if($execResponses[$execIndex]) {
						for(const response of $execResponses[$execIndex]) {
							if(response.command === '*' || response.command === commandline) {
								output = response.output;

								break;
							}
						}

						$execIndex += 1;
					}

					$execCommands.push(commandline);

					return ok({
						args: [],
						command: '',
						cwd: '',
						durationMs: 1,
						exitCode: 0,
						merged: output,
						stderr: '',
						stdout: output,
					})
				},
				unwrapFatal: (result: Result<unknown, unknown>) => {
					if (result.fails) {
						const message = stringifyError(result.error) ?? String(result.error);

						$exitOutput.push(message);

						throw message;
					}

					return result.value;
				}
			};
		});

		const importedModule = await vi.importActual(path);

		vi.doUnmock('node:fs');
		vi.doUnmock('node:fs/promises');
		vi.doUnmock('node:process');
		vi.doUnmock('@zokugun/cli-utils');

		let result: Result<Value, unknown>;

		const config = await configure(manifest);

		if(config.fails) {
			result = err($exitOutput.join('\n') || stringifyError(config.error));
		}
		else {
			const { args } = config.value;

			if('responses' in config.value) {
				$execResponses = config.value.responses;
			}
			else {
				$execResponses = [[config.value.response]];
			}

			if(DEBUG_VOL) {
				console.log(vol.toJSON());
			}

			try {
				const fn = importedModule[name];

				expect(fn).toBeTypeOf('function');

				await (fn as Function)(...args);

				result = ok({
					code: $exitCode!,
					commands: $execCommands,
					output: $exitOutput.join('\n'),
				});
			}
			catch(error) {
				result = err($exitOutput.join('\n') || stringifyError(error));
			}

			if(DEBUG_VOL) {
				console.log(vol.toJSON());
			}
		}

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
