import type { Result } from '@zokugun/xtry/result';
import type { MatcherResult } from 'vitest';

import { isResult } from '#/utils/isResult.js';

export function toFail(received: unknown): MatcherResult {
	const result = assertResult(received, 'toFail');
	const pass = result.fails;

	return {
		pass,
		message: () => pass	? `Expected result not to fail.\n\n${formatResult(result)}` : `Expected result to fail.\n\n${formatResult(result)}`,
		actual: result.fails,
		expected: true,
	};
}

export function toSucceed(received: unknown): MatcherResult {
	const result = assertResult(received, 'toSucceed');
	const pass = !result.fails;

	return {
		pass,
		message: () => pass	? `Expected result not to succeed.\n\n${formatResult(result)}` : `Expected result to succeed.\n\n${formatResult(result)}`,
		actual: result.fails,
		expected: false,
	};
}

function assertResult(received: unknown, matcherName: string): Result<unknown, unknown> {
	if (isResult(received)) {
		return received;
	}

	throw new TypeError(`${matcherName} expected a Result-compatible object.`);
}

function formatResult(result: Result<unknown, unknown>): string {
	return [
		// `stderr: ${JSON.stringify(result.stderr)}`,
	].join('\n');
}
