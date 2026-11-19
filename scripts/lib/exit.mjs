// Finish a one-shot script after its last `fetch`, with the exit code it chose.
//
// `process.exit()` straight after a `fetch` can die on Windows inside libuv
// (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file
// srcwinasync.c`, exit 127) because undici's keep-alive socket is still open
// while the process tears down. For a gate whose non-zero exit means "do not
// apply", that turns a passing verdict into an apparent failure (facility-map-
// holders, 0.34.0). Calling process.exit is the trigger, so this does not: it
// sets process.exitCode, closes the shared fetch dispatcher, flushes stdout and
// stderr, and returns, and node exits by itself once the loop is empty.
//
// Contract: `await exitWith(code)` is the LAST thing a script does. It returns
// (it does not stop the script, so guard any code after it with else/return),
// never throws, and the exit code is exactly `code`.
// docs/decisions/2026-10-16-shared-exit-helper.md

const drain = (stream) => new Promise((resolve) => stream.write("", resolve));
const turn = () => new Promise((resolve) => setImmediate(resolve));

export async function exitWith(code = 0) {
  process.exitCode = code;
  try {
    await globalThis[Symbol.for("undici.globalDispatcher.1")]?.close();
  } catch {
    // nothing open, or already closed
  }
  try {
    await drain(process.stdout);
    await drain(process.stderr);
    await turn();
  } catch {
    // a closed pipe must not change the verdict
  }
}

// For a script whose exits sit in helpers (`fail()` called from anywhere), where
// `return code` cannot reach them: a helper calls `bail(code)` instead of
// `process.exit(code)`, and the script's entry point runs inside `runMain`,
// which turns the throw back into `await exitWith(code)`.
//
// Contract: `bail` must not be called inside a `try` whose `catch` swallows
// errors (it would be swallowed with them); rethrow ExitRequest if you must.
// Any other error escaping main prints its stack and exits 1, as node would.
export class ExitRequest extends Error {
  constructor(code) {
    super(`exit ${code}`);
    this.code = code;
  }
}

export function bail(code = 1) {
  throw new ExitRequest(code);
}

export async function runMain(main) {
  let code = 0;
  try {
    const r = await main();
    if (typeof r === "number") code = r;
  } catch (e) {
    if (e instanceof ExitRequest) code = e.code;
    else {
      console.error(e?.stack ?? e);
      code = 1;
    }
  }
  await exitWith(code);
}
