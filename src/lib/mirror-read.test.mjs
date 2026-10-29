import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

// `server-only` cannot load under plain Node: test a copy of the module without that one line.
const copy = path.join(os.tmpdir(), `mirror-read-${process.pid}.ts`);
fs.writeFileSync(copy, fs.readFileSync(new URL("./mirror-read.ts", import.meta.url), "utf8").replace('import "server-only";', ""));
const { readMirroredFile, openMirroredVideo } = await import(pathToFileURL(copy).href);

const root = fs.mkdtempSync(path.join(os.tmpdir(), "mirror-"));
fs.mkdirSync(path.join(root, "_mirror"));
fs.mkdirSync(path.join(root, "lanna", "Residents"), { recursive: true });
fs.writeFileSync(path.join(root, "lanna", "Residents", "a.jpg"), "JPG");
fs.writeFileSync(path.join(root, "lanna", "Residents", "v.mp4"), "VID");
fs.writeFileSync(path.join(root, "secret.png"), "OUT");
fs.writeFileSync(
  path.join(root, "_mirror", "state.json"),
  JSON.stringify({
    ok: { path: "Residents/a.jpg", modifiedTime: "t" },
    gone: { path: "Residents/a.jpg", modifiedTime: "t", gone: "x" },
    video: { path: "Residents/v.mp4", modifiedTime: "t" },
    escape: { path: "../secret.png", modifiedTime: "t" },
    missing: { path: "Residents/none.jpg", modifiedTime: "t" },
  }),
);

test("off without MIRROR_DEST", async () => {
  delete process.env.MIRROR_DEST;
  assert.equal(await readMirroredFile("ok"), null);
});
test("no state.json is a miss", async () => {
  process.env.MIRROR_DEST = path.join(root, "nowhere");
  assert.equal(await readMirroredFile("ok"), null);
});
test("with an index", async () => {
  process.env.MIRROR_DEST = root;
  const f = await readMirroredFile("ok");
  assert.equal(f.contentType, "image/jpeg");
  assert.equal(f.body.toString(), "JPG");
  for (const id of ["gone", "video", "escape", "missing", "unknown", "__proto__"]) assert.equal(await readMirroredFile(id), null, id);
});

const drain = async (b) => Buffer.concat(await Array.fromAsync(b)).toString();
test("video: whole file, ranges, suffix, unsatisfiable, misses", async () => {
  process.env.MIRROR_DEST = root;
  let v = await openMirroredVideo("video", null);
  assert.equal(v.status, 200);
  assert.equal(v.contentType, "video/mp4");
  assert.equal(v.headers["Content-Length"], "3");
  assert.equal(await drain(v.body), "VID");
  v = await openMirroredVideo("video", "bytes=1-");
  assert.equal(v.status, 206);
  assert.equal(v.headers["Content-Range"], "bytes 1-2/3");
  assert.equal(await drain(v.body), "ID");
  v = await openMirroredVideo("video", "bytes=-1");
  assert.equal(await drain(v.body), "D");
  v = await openMirroredVideo("video", "bytes=0-99");
  assert.equal(v.headers["Content-Range"], "bytes 0-2/3");
  assert.deepEqual(await openMirroredVideo("video", "bytes=5-"), { unsatisfiable: 3 });
  for (const id of ["ok", "gone", "escape", "missing", "unknown", "__proto__"]) assert.equal(await openMirroredVideo(id, null), null, id);
  delete process.env.MIRROR_DEST;
  assert.equal(await openMirroredVideo("video", null), null);
});
