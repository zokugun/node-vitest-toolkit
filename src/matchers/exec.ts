import type { MatcherResult } from 'vitest';
import type { ExecResult } from '#/types.js';

import { isBoolean, isNumber, isRecord, isString } from '@zokugun/is-it-type';

import { isResult } from '#/utils/isResult.js';

export function toExitWith(received: unknown, expectedExitCode: number): MatcherResult {
	const result = assertExecResult(received, 'toExitWith');
	const exitCode = result.value?.exitCode ?? result.error?.exitCode;

	if (!isNumber(exitCode)) {
		throw new TypeError(`toExitWith expected a ExecResult-compatible object.`);
	}

	const pass = exitCode === expectedExitCode;

	return {
		pass,
		message: () => pass ? `Expected command not to exit with ${String(expectedExitCode)}.\n\n${formatExecResult(result)}` : `Expected command to exit with ${String(expectedExitCode)}.\n\n${formatExecResult(result)}`,
		actual: exitCode,
		expected: expectedExitCode,
	};
}

export function toHaveStderr(received: unknown, expected: string | RegExp): MatcherResult {
	const result = assertExecResult(received, 'toHaveStderr');
	const stdout = result.value?.stderr ?? result.error?.stderr;

	if (!isString(stdout)) {
		throw new TypeError(`toHaveStderr expected a ExecResult-compatible object.`);
	}

	const pass = matchesText(stdout, expected);

	return {
		pass,
		message: () => pass ? `Expected stderr not to match.\n\n${makeMismatchMessage('stderr', expected, stdout)}` : `Expected stderr to match.\n\n${makeMismatchMessage('stderr', expected, stdout)}`,
		actual: stdout,
		expected,
	};
}

export function toHaveStdout(received: unknown, expected: string | RegExp): MatcherResult {
	const result = assertExecResult(received, 'toHaveStdout');
	const stdout = result.value?.stdout ?? result.error?.stdout;

	if (!isString(stdout)) {
		throw new TypeError(`toHaveStdout expected a ExecResult-compatible object.`);
	}

	const pass = matchesText(stdout, expected);

	return {
		pass,
		message: () => pass ? `Expected stdout not to match.\n\n${makeMismatchMessage('stdout', expected, stdout)}` : `Expected stdout to match.\n\n${makeMismatchMessage('stdout', expected, stdout)}`,
		actual: stdout,
		expected,
	};
}

function assertExecResult(received: unknown, matcherName: string): ExecResult {
	if (isExecResult(received)) {
		return received;
	}

	throw new TypeError(`${matcherName} expected a ExecResult-compatible object.`);
}

function formatExecResult(result: ExecResult): string {
	if(result.fails) {
		return [
			`command: ${result.error.command}`,
			`args: ${result.error.args}`,
			`cwd: ${result.error.cwd}`,
			`exitCode: ${result.error.exitCode}`,
			`signalCode: ${result.error.signalCode}`,
			`canceled: ${result.error.canceled}`,
			`stdout: ${result.error.stdout}`,
			`stderr: ${result.error.stderr}`,
		].join('\n');
	}
	else {
		return [
			`command: ${result.value.command}`,
			`args: ${result.value.args}`,
			`cwd: ${result.value.cwd}`,
			`exitCode: ${result.value.exitCode}`,
			`stdout: ${result.value.stdout}`,
			`stderr: ${result.value.stderr}`,
		].join('\n');
	}
}

function isExecResult(result: unknown): result is ExecResult {
	if (!isResult(result) || !isBoolean(result.fails)) {
		return false;
	}

	if(result.fails) {
		if(!isRecord(result.error) || !isString(result.error.command) || !isNumber(result.error.durationMs)) {
			return false;
		}
	}
	else {
		if(!isRecord(result.value) || !isString(result.value.command) || !isNumber(result.value.durationMs)) {
			return false;
		}
	}

	return true;
}

function makeMismatchMessage(label: string, expected: string | RegExp, actual: string): string {
	return `${label} mismatch\nexpected: ${String(expected)}\nactual: ${JSON.stringify(actual)}`;
}

function matchesText(actual: string, expected: string | RegExp): boolean {
	if (isString(expected)) {
		return actual.includes(expected);
	}

	return expected.test(actual);
}
