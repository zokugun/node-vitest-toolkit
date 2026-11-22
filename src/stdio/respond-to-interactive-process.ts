import { setTimeout } from 'node:timers/promises';
import { stripVTControlCharacters } from 'node:util'

import { expandKeyTokens } from './expand-key-tokens.js';

export type InteractiveTask = {
	process?: {
		stdin?: NodeJS.WritableStream | null;
		stdout?: NodeJS.ReadableStream | null;
	};
};

type Interaction = {
	on: readonly string[];
	send: string;
};


type Options = {
	stripAnsi?: boolean;
	timeout?: number;
}

export function respondToInteractiveProcess(task: InteractiveTask, interactions: readonly Interaction[], options: Options): void {
	const { stripAnsi = false, timeout = 100 } = options;

	const lines: string[] = [];

	let buffer = '';
	let nextInteraction = 0;
	let waiting = false;

	const sendMatches = async (): Promise<void> => {
		if(waiting || nextInteraction >= interactions.length) {
			return;
		}

		waiting = true;

		const bufferedLines = [...lines];
		const bufferedBuffer = buffer;

		if(buffer.length > 0) {
			bufferedLines.push(bufferedBuffer);
		}

		const { on, send } = interactions[nextInteraction];

		if(on.length <= bufferedLines.length && on.every((line, lineIndex) => bufferedLines.at(-(on.length - lineIndex))?.includes(line))) {
			nextInteraction += 1;

			if(bufferedBuffer === buffer) {
				buffer = '';
			}

			task.process?.stdin?.write(expandKeyTokens(send));

			await setTimeout(timeout);

			if(nextInteraction === interactions.length) {
				task.process?.stdin?.end();
			}
			else if(lines.length > 0) {
				waiting = false;

				return sendMatches();
			}
		}

		waiting = false;

		if(lines.length > bufferedLines.length) {
			sendMatches();
		}
	};

	task.process?.stdout?.on('data', async (chunk: Buffer | string) => {
		if(stripAnsi) {
			buffer += stripVTControlCharacters(String(chunk));
		}
		else {
			buffer += String(chunk);
		}

		const splitLines = buffer.split(/\r\n|\n|\r/);

		buffer = splitLines.pop() ?? '';

		lines.push(...splitLines);

		await sendMatches();
	});
}
