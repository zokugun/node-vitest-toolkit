import type { MaybePromise } from './types.js';

import fse from '@zokugun/fs-extra-plus/async';
import { isArray, isRecord } from '@zokugun/is-it-type';
import { xtrySync } from '@zokugun/xtry';
import { describe, it } from 'vitest';
import YAML from 'yaml';

type Options<Manifest> = {
	fixture?: (basename: string) => boolean;
	groupName?: (basename: string) => string;
	testName?: (manifest: Manifest) => string;
};

export async function defineGroupedTests<Manifest extends Record<string, unknown>>(
	action: (manifest: Manifest) => MaybePromise<void>,
	options: Options<Manifest> = {}
): Promise<void> {
	const validateFixture = options.fixture ?? (() => true);
	const generateGroupName = options.groupName ?? ((basename) => basename.split('.')[0]);
	const generateTestName = options.testName ?? ((manifest) => manifest.testName as string);

	const fixtureRoot = fse.join('.', 'test', 'fixtures');

	const files = await fse.walk(fixtureRoot, {
		absolute: true,
		onlyFiles: true,
		collect: true,
		filter: (item) => item.path.endsWith('.yml') && validateFixture(fse.baseName(item.path)),
	});

	if(files.fails) {
		throw files.error;
	}

	for(const file of files.value) {
		const readResult = await fse.readFile(file.path, 'utf8');

		if(readResult.fails) {
			throw readResult.error;
		}

		const manifestResult = xtrySync(() => YAML.parse(readResult.value) as unknown);

		if(manifestResult.fails) {
			console.error(file.path);

			throw manifestResult.error;
		}


		const manifest = manifestResult.value;

		if(!isArray(manifest)) {
			throw new Error(`The file "${fse.relative(fixtureRoot, file.path)}" isn't an array.`);
		}

		const groupName = generateGroupName(fse.baseName(file.path));

		describe(groupName, () => {
			for(const data of manifest) {
				if(!isRecord(data)) {
					throw new Error('Expect an object');
				}

				const name = generateTestName(data as Manifest)

				it(name, async () => {
					await action(data as Manifest);
				});
			}
		});
	}
}
