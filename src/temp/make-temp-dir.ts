import fse from '@zokugun/fs-extra-plus/async';
import { namegen } from '@zokugun/namegen-lite';
import { expect } from 'vitest';

export async function makeTempDir(): Promise<string> {
	const state = expect.getState();

	let prefix: string;

	if(state?.testPath) {
		const name = fse.baseName(state.testPath).replaceAll(/[^A-Za-z0-9]+/g, '-');

		prefix = fse.sanitizeSegment(name);
	}
	else {
		prefix = namegen();
	}

	const result = await fse.makeTempDir({ prefix });

	if(result.fails) {
		throw result.error;
	}

	return result.value;
}
