import fse from '@zokugun/fs-extra-plus/async';
import process from 'node:process';

import { makeTempDir } from './make-temp-dir.js';

export async function withTemp(run: (root: string) => Promise<void>): Promise<void> {
	const root = await makeTempDir();
	const originalCwd = process.cwd();

	try {
		process.chdir(root);

		await run(root);
	}
	finally {
		process.chdir(originalCwd);

		await fse.remove(root);
	}
}
