import { isArray, isString } from '@zokugun/is-it-type';
import { Readable } from 'node:stream';

import { expandKeyTokens } from './expand-key-tokens.js';
import { readableFromStringsWithDelay } from './readable-from-strings-with-delay.js';

export function createStdinStream(input: unknown, delayMs: number = 100): Readable | undefined {
	let strings: string[];

	if(isString(input)) {
		strings = [input];
	}
	else if(isArray<string>(input, isString)) {
		strings = input;
	}
	else {
		return undefined;
	}

	if(input) {
		const encodedInput = strings.map(expandKeyTokens);

		return readableFromStringsWithDelay(encodedInput, delayMs);
	}
	else {
		return undefined;
	}
}
