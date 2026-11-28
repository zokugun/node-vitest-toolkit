import type { MatcherResult } from 'vitest';

import { isString } from '@zokugun/is-it-type';

export function toStartWith(received: unknown, expected: string): MatcherResult {
	if (!isString(received)) {
		throw new TypeError('toStartWith expected a string.');
	}

	if (!isString(expected)) {
		throw new TypeError('toStartWith expected the prefix to be a string.');
	}

	const pass = received.startsWith(expected);

	return {
		pass,
		message: () => pass ? `Expected string not to start with ${JSON.stringify(expected)}.\n\nActual: ${JSON.stringify(received)}` : `Expected string to start with ${JSON.stringify(expected)}.\n\nActual: ${JSON.stringify(received)}`,
		actual: received,
		expected,
	};
}