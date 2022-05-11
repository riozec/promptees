type opts<OnTimeout> = {
	/**
	 * Timeout in milliseconds. If `returnPrompt()` is not called after the timeout has elapsed, the `waitForResponse()` will return `{timeout: true}` or the specified onTimeout return value.
	 */
	timeout?: number;
	/**
	 * Function called when the timeout has elapsed, and its return value will be returned by `waitForResponse()`.
	 */
	onTimeout?: () => OnTimeout;
};

export default class Prompt<Input, OnTimeout = void> {
	private promptees: { [identifier: string]: (value: any) => void } = {};
	private timeout?: number;
	private onTimeout?: () => OnTimeout;

	constructor(opts?: opts<OnTimeout>) {
		if (opts?.timeout) this.timeout = opts.timeout;
		if (opts?.onTimeout) this.onTimeout = opts.onTimeout;
	}

	/**
	 * Check if identifier is waiting for an input.
	 *
	 * @returns {boolean} True if identifier is in promptees list. Otherwise False.
	 */
	isPrompting(identifier: string): boolean {
		if (identifier in this.promptees) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Resolves `waitForResponse()` called with the same identifier.
	 *
	 * @param value The value returned by `waitForResponse()`
	 * @returns {boolean} True if identifier is in promptees list. Otherwise False.
	 */
	returnPrompt(identifier: string, value: Input): boolean {
		if (identifier in this.promptees) {
			this.promptees[identifier](value);
			delete this.promptees[identifier];
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Prompt the user!
	 *
	 * Resolves after calling returnPrompt() with the same identifier. Returns the value passed to returnPrompt().
	 *
	 * If timeout and onTimeout are set, it will call onTimeout() and returns the value after the timeout has elapsed.
	 * Otherwise, if onTimeout is not set, it will return {timeout: true}.
	 *
	 * @resolves Value passed to `returnPrompt()` with the same identifier.
	 */
	waitForResponse(identifier: string, opts?: opts<OnTimeout>) {
		return new Promise<Input | OnTimeout | { timeout: true }>((resolve) => {
			if ((opts?.timeout ?? this.timeout) > 0) {
				const timeoutId = setTimeout(() => {
					this.promptees[identifier]((opts?.onTimeout ?? this.onTimeout)?.() || { timeout: true });
					delete this.promptees[identifier];
				}, this.timeout);
				this.promptees[identifier] = function (value) {
					clearTimeout(timeoutId);
					return resolve(value);
				};
			} else {
				this.promptees[identifier] = function (value) {
					return resolve(value);
				};
			}
		});
	}
}
