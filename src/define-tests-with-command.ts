import type { Command, Options as CmdOptions } from '@zokugun/exec-lite'
import type { Options as CliOptions } from './define-tests-with-exec.js';

import { isArray, isString } from '@zokugun/is-it-type';
import { isCI } from '@zokugun/cli-utils';

import { defineTestsWithExec } from './define-tests-with-exec.js';
import { mocks } from './index.js';

export async function defineTestsWithCommand<O extends Partial<CmdOptions> = {}>(command: Command<O>, name: string | null | undefined, commandOptions: Partial<CmdOptions> = {}, cliOptions: CliOptions = {}): Promise<void> {
	await defineTestsWithExec(async (manifest, root) => {
		const args: string[] = [];
		const stdin = mocks.stdin(manifest.input);

		if(isString(name)) {
			args.push(name);
		}

		if(isArray<string>(manifest.args, isString)) {
			args.push(...manifest.args);
		}

		const result = await command(args, {
			...commandOptions,
			cwd: root,
			stdin,
		});

		if((stdin || (isString(manifest.output) && manifest.output.startsWith('?'))) && isCI()) {
			return;
		}

		return result;
	}, cliOptions);
}
