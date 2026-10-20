// The one way to count what a URL served. fetch() already undoes any gzip/br the
// edge applied, so these are the decoded bytes — what is on disk in `.next`.
//
// Counting `(await res.text()).length` instead is wrong for any file with a
// non-ASCII character: that is UTF-16 code units, not bytes. On 2026-10-20 it made
// purge-cache.mjs report 96235 for a stylesheet check-assets.mjs (which reads an
// ArrayBuffer) correctly reported as 96239 and identical to the build.
export async function fetchBytes(url, init) {
  const res = await fetch(url, init);
  return { res, bytes: Buffer.from(await res.arrayBuffer()) };
}
