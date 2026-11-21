import { Result } from '@zokugun/xtry/result';

export type ExecFailure = {
	args: readonly string[];
	canceled: boolean;
	cwd?: string;
	command: string;
	durationMs: number;
	error?: Error;
	exitCode?: number;
	merged?: string;
	pipedFrom?: Subprocess;
	signalCode?: string;
	stderr?: string;
	stdout?: string;
}

export type ExecResult = Result<ExecSuccess, ExecFailure>;

export type ExecSuccess = {
	args: readonly string[];
	command: string;
	cwd: string;
	durationMs: number;
	error?: undefined;
	exitCode: number;
	merged: string;
	pipedFrom?: Subprocess;
	stderr: string;
	stdout: string;
};

export type MaybePromise<T> = Promise<T> | T;

export type Subprocess<R = ExecResult> = AsyncIterable<string> & PromiseLike<R> & {
	get aborted(): boolean;
	get error(): Error | undefined;
	get exitCode(): number | undefined;
	get failed(): boolean;
	get killed(): boolean;
	get pid(): number | undefined;
	get signalCode(): string | undefined;
};
