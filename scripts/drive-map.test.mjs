import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMap, rootOf, leftoverSql, WRITABLE_APP_ENVS } from "./lib/drive-map.mjs";

const A = "1AAAAAAAAAAAAAAAAAAAA";
const B = "1BBBBBBBBBBBBBBBBBBBB";
const R = "1RRRRRRRRRRRRRRRRRRRR";
const S = "1SSSSSSSSSSSSSSSSSSSS";
const map = [
  JSON.stringify({ from: S, to: R, kind: "root", path: "Production (UAT copy)" }),
  JSON.stringify({ from: A, to: B, kind: "file", path: "x.jpg" }),
  JSON.stringify({ from: "short", to: B }),
  JSON.stringify({ from: A, to: "x'; drop table residents; --" }),
].join("\r\n");

test("parseMap keeps well-formed pairs, drops short or unsafe ids, reads CRLF", () => {
  const p = parseMap(map + "\r\n");
  assert.equal(p.length, 2);
  assert.deepEqual(p.map((x) => x.to), [R, B]);
});

test("rootOf finds the root line", () => {
  assert.equal(rootOf(parseMap(map)), R);
  assert.equal(rootOf([]), null);
});

test("leftoverSql inlines only the parsed ids and refuses odd names", () => {
  const sql = leftoverSql("attachments", "drive_file_id", parseMap(map));
  assert.match(sql, new RegExp(`\\('${B}'\\)`));
  assert.match(sql, new RegExp(`\\('${A}'\\)`));
  assert.doesNotMatch(sql, /drop table/);
  assert.throws(() => leftoverSql('x"; drop', "drive_file_id", []));
});

test("only dev and uat may be touched", () => {
  assert.deepEqual([...WRITABLE_APP_ENVS].sort(), ["dev", "uat"]);
  assert.equal(WRITABLE_APP_ENVS.has("production"), false);
});
