import type { MaybePromise } from '#/types.js';

import fse from '@zokugun/fs-extra-plus/async';
import { isRecord } from '@zokugun/is-it-type';
import { xtrySync } from '@zokugun/xtry';
import { it } from 'vitest';
import YAML from 'yaml';

import { extendMatchers } from '#/matchers/index.js';

extendMatchers();

export type RawOptions = {
	fixture?: string;
	timeout?: number;
	validate?: (name: string, manifest: Record<string, unknown>) => boolean;
};

export async function defineRawTests<Manifest extends Record<string, unknown>>(
	action: (manifest: Manifest) => MaybePromise<void>,
	options: RawOptions = {}
): Promise<void> {
	const fixtureRoot = fse.join('.', 'test', 'fixtures', options.fixture ?? '');

	const files = await fse.walk(fixtureRoot, {
		absolute: true,
		onlyFiles: true,
		collect: true,
		filter: (item) => item.path.endsWith('.yml'),
	});

	if(files.fails) {
		throw files.error;
	}

	const {
		timeout,
		validate = () => true,
	} = options;

	for(const file of files.value) {
		const name = fse.baseName(file.path, 1);

		it(name, async ({ skip }) => {
			const readResult = await fse.readFile(file.path, 'utf8');

			if(readResult.fails) {
				throw readResult.error;
			}

			const manifestResult = xtrySync(() => YAML.parse(readResult.value) as unknown);

			if(manifestResult.fails) {
				console.error(file.path);

				throw manifestResult.error;
			}

			const manifest = manifestResult.value as Manifest;

			if(!isRecord(manifest)) {
				throw new Error(`The file "${fse.relative(fixtureRoot, file.path)}" isn't an object.`);
			}

			if(!validate(name, manifest)) {
				skip();
			}

			await action(manifest);
		}, timeout);
	}
}
