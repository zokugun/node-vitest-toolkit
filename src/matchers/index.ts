import { expect } from 'vitest';

import { toExitWith, toHaveStderr, toHaveStdout } from './exec.js';
import { toFail, toSucceed } from './result.js';

let $installed = false;

export function extendMatchers(): void {
	if($installed) {
		return;
	}

	$installed = true;

	expect.extend({
		toExitWith,
		toFail,
		toHaveStdout,
		toHaveStderr,
		toSucceed,
	});
}
