import process from 'node:process';
import { vi } from 'vitest';

import { memfs } from './memfs.js';

const DEBUG = process.env.DEBUG === '1' || process.env.DEBUG === 'true' || process.env.DEBUG === 'on' || process.env.DEBUG === 'vol';

export function mockForInMemoryFiles(workingDirectory: string = '/working'): void {
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
			cwd: () => workingDirectory,
			env: {},
		},
	}));

	vi.doMock('@zokugun/cli-utils', async (importOriginal) => {
		const mod = await importOriginal();
		const { logger, unwrapFatal } = mod as any;

		return {
			c: {
				bgBlue: (value: string) => value,
				cyan: {
					bold: (value: string) => value,
				},
			},
			logger: {
				...logger,
				beginTimer: () => {},
				debug: (message: string) => {
					if(DEBUG) {
						console.log(message);
					}
				},
				createSpinner: () => ({
					fail: () => {},
					succeed: () => {},
				}),
				fatal: (message: string) => {
					throw new Error(message);
				},
				finishTimer: () => {},
				info: (message: string) => {
					if(DEBUG) {
						console.log(message);
					}
				},
				newLine: () => {},
				print: (message: string) => {
					if(DEBUG) {
						console.log(message);
					}
				},
			},
			unwrapFatal,
		};
	});

	vi.doMock('@zokugun/cli-utils/logger', async (importOriginal) => {
		const mod = await importOriginal();
		const { logger } = mod as any;

		return {
			...logger,
			beginTimer: () => {},
			debug: (message: string) => {
				if(DEBUG) {
					console.log(message);
				}
			},
			createSpinner: () => ({
				fail: () => {},
				succeed: () => {},
			}),
			fatal: (message: string) => {
				throw new Error(message);
			},
			finishTimer: () => {},
			info: (message: string) => {
				if(DEBUG) {
					console.log(message);
				}
			},
			newLine: () => {},
			print: (message: string) => {
				if(DEBUG) {
					console.log(message);
				}
			},
		};
	});
}

export function unmockForInMemoryFiles(): void {
	vi.doUnmock('node:fs');
	vi.doUnmock('node:fs/promises');
	vi.doUnmock('node:process');
	vi.doUnmock('@zokugun/cli-utils');
	vi.doUnmock('@zokugun/cli-utils/logger');
}
