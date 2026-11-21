import type { Options } from './raw/define-raw-tests-with-file.js';
import type { MaybePromise } from './types.js';

import fse from '@zokugun/fs-extra-plus/async';
import { isString } from '@zokugun/is-it-type';
import { stringifyError } from '@zokugun/xtry/async';
import { expect } from 'vitest';
import { defineRawTestWithFiles } from './raw/define-raw-tests-with-file.js';

export async function defineTestsWithFiles(action: (manifest: Record<string, unknown>, root: string) => MaybePromise<void>, options: Options = {}): Promise<void> {
	await defineRawTestWithFiles(async (manifest, workingDirectory, expectedFiles, debug) => {
		await action(manifest, workingDirectory);

		for(const [file, data] of Object.entries(expectedFiles)) {
			const result = await fse.readFile(fse.join(workingDirectory, file), 'utf8');

			if(isString(data)) {
				if(debug && result.fails) {
					console.log(`Expecting file at "${file}"`);
				}

				expect(result.fails).to.be.false;
				expect(result.value).to.eql(data);
			}
			else {
				expect(result.fails).to.be.true;
				expect(stringifyError(result.error)).to.eql(`${data.error}, open '${fse.join(workingDirectory, file)}'`);
			}
		}
	}, options);
}
