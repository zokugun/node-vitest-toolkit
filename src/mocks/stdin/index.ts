import { isArray, isString } from '@zokugun/is-it-type';
import { Readable } from 'node:stream';

import { encodeInput } from './encode-input.js';
import { readableFromStringsWithDelay } from './readable-from-strings-with-delay.js';

export function stdin(input: unknown, delayMs: number = 100): Readable | undefined {
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
		const encodedInput = strings.map(encodeInput);

		return readableFromStringsWithDelay(encodedInput, delayMs);
	}
	else {
		return undefined;
	}
}
