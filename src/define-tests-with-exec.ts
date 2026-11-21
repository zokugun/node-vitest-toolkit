import type { Options as RawOptions } from './raw/define-raw-tests-with-file.js';
import type { ExecResult, MaybePromise } from './types.js';

import fse from '@zokugun/fs-extra-plus/async';
import { isString } from '@zokugun/is-it-type';
import { stringifyError } from '@zokugun/xtry/async';
import { stripVTControlCharacters } from 'node:util'
import { expect } from 'vitest';

import { defineRawTestWithFiles } from './raw/define-raw-tests-with-file.js';

export type Options = RawOptions & {
	stripAnsi?: boolean;
};

export async function defineTestsWithExec(action: (manifest: Record<string, unknown>, root: string) => MaybePromise<ExecResult | undefined>, options: Options = {}): Promise<void> {
	await defineRawTestWithFiles(async (manifest, workingDirectory, expectedFiles, debug) => {
		const result = await action(manifest, workingDirectory);

		if(!result) {
			return;
		}

		if(options.stripAnsi) {
			if(result.fails) {
				result.error.merged = isString(result.error.merged) ? stripVTControlCharacters(result.error.merged) : undefined;
				result.error.stderr = isString(result.error.stderr) ? stripVTControlCharacters(result.error.stderr) : undefined;
				result.error.stdout = isString(result.error.stdout) ? stripVTControlCharacters(result.error.stdout) : undefined;
			}
			else {
				result.value.merged = stripVTControlCharacters(result.value.merged);
				result.value.stderr = stripVTControlCharacters(result.value.stderr);
				result.value.stdout = stripVTControlCharacters(result.value.stdout);
			}
		}

		if(isString(manifest.error)) {
			if(debug && (!result.fails || !result.error!.stdout?.includes('✖ Fatal!') || !result.error!.stdout?.includes(manifest.error))) {
				console.log(result)
			}

			expect(result).toFail();
			expect(result).toHaveStdout('✖ Fatal!');
			expect(result).toHaveStdout(manifest.error);
		}
		else if(isString(manifest.output)) {
			if(debug && !(result.value ?? result.error).stdout?.includes(manifest.output)) {
				console.log(result)
			}

			expect(result).toHaveStdout(manifest.output);
		}
		else {
			if(debug && (result.fails || !result.value.stdout.includes('🏁 Done'))) {
				console.log(result)
			}

			expect(result).toSucceed();
			expect(result).toHaveStdout('🏁 Done');

			for(const [file, data] of Object.entries(expectedFiles)) {
				const content = await fse.readFile(fse.join(workingDirectory, file), 'utf8');

				if(isString(data)) {
					if(debug && content.fails) {
						console.log(`Expecting file at "${file}"`);
					}

					if(debug && content.value !== data) {
						console.log(result)
					}

					expect(content.fails).to.be.false;
					expect(content.value).to.eql(data);
				}
				else {
					expect(content.fails).to.be.true;
					expect(stringifyError(content.error)).to.eql(`${data.error}, open '${fse.join(workingDirectory, file)}'`);
				}
			}
		}
	}, options);
}
