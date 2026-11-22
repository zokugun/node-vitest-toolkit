import { Readable } from 'node:stream';
import { setTimeout } from 'node:timers/promises';

export function readableFromStringsWithDelay(strings: string[], delayMs = 100): Readable {
	return Readable.from(
		(async function* () {
			for (const value of strings) {
				yield value;

				await setTimeout(delayMs);
			}
		})(),
	);
}
