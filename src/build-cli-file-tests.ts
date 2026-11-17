
import process from 'node:process';
import fse from '@zokugun/fs-extra-plus';
import { isRecord, isString } from '@zokugun/is-it-type';
import { stringifyError, xtryAsync, xtrySync } from '@zokugun/xtry';
import { vol } from 'memfs';
import { expect, it } from 'vitest';
import YAML from 'yaml';

type Options = {
	additionals?: string[];
	fixture?: string;
	input?: string;
	output?: string;
	transformFile?: (type: 'additional' | 'input' | 'output', path: string, content: string) => string
};

const DEBUG = process.env.DEBUG === '1' || process.env.DEBUG === 'true' || process.env.DEBUG === 'on';
const DEBUG_VOL = process.env.DEBUG === 'vol';

export function buildCliFileTests(action: (manifest: Record<string, unknown>) => unknown, options: Options = {}): void {
	const fixtureRoot = fse.join('.', 'test', 'fixtures', options.fixture ?? '');

	const files = fse.walkSync(fixtureRoot, {
		absolute: true,
		onlyFiles: true,
		collect: true,
		filter: (item) => item.path.endsWith('.yml'),
	});

	if(files.fails) {
		throw files.error;
	}

	const { additionals = [], input = 'input', output = 'output', transformFile = (_type, _path, content) => content } = options;

	for(const file of files.value) {
		const name = fse.leafName(file.path, 1);

		const readResult = fse.readFileSync(file.path, 'utf8');
		if(readResult.fails) {
			throw readResult.error;
		}

		const manifestResult = xtrySync(() => YAML.parse(readResult.value) as unknown);
		if(manifestResult.fails) {
			console.error(file.path);

			throw manifestResult.error;
		}

		const manifest = manifestResult.value as Record<string, unknown>;

		if(!isRecord(manifest)) {
			throw new Error(`The file "${fse.relative(fixtureRoot, file.path)}" isn't an object.`);
		}

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

			it(name, async () => {
				vol.fromJSON(fromJSON);

				await expect(action(manifest)).rejects.toThrow(error);
			});
		}
		else {
			it(name, async () => {
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
			});
		}
	}
}
