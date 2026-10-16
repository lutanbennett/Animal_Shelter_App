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
