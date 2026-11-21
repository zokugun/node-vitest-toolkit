import type { Result } from '@zokugun/xtry/result';

import { isBoolean, isNonNullable, isRecord } from '@zokugun/is-it-type';

export function isResult(result: unknown): result is Result<unknown, unknown> {
	if(!isRecord(result) || !isBoolean(result.fails)) {
		return false;
	}

	if(result.fails) {
		return isNonNullable(result.error);
	}

	return true;
}
