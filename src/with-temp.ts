import process from 'node:process';
import fse from '@zokugun/fs-extra-plus/async';

export async function withTemp(prefix: string, run: (root: string) => Promise<void>): Promise<void> {
	const result = await fse.makeTempDir({ prefix });

	if(result.fails) {
		throw result.error;
	}

	const root = result.value;
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
