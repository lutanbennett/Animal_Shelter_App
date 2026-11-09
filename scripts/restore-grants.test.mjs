// scripts/lib/restore-grants.mjs: which backup entries are replayed, and how the result is compared.
import { test } from "node:test";
import assert from "node:assert/strict";
import { aclObject, aclStatements, aclTocLines, archiveObjects, compareAcls, resetSql } from "./lib/restore-grants.mjs";

const TOC = `
;
; Archive created at 2026-11-08 03:02:11 UTC
1; 2615 16400 SCHEMA - private postgres
10; 1259 16500 TABLE public residents postgres
11; 1259 16510 VIEW private resident_current_state postgres
12; 1255 16520 FUNCTION private works_with_residents() postgres
13; 1255 16530 FUNCTION public shelter_today() postgres
14; 1259 16540 TABLE auth users supabase_auth_admin
5000; 0 0 ACL - SCHEMA private postgres
5001; 0 0 ACL public TABLE residents postgres
5002; 0 0 ACL private TABLE resident_current_state postgres
5003; 0 0 ACL private FUNCTION works_with_residents() postgres
5004; 0 0 ACL auth TABLE users supabase_auth_admin
5005; 0 0 ACL public FUNCTION approved_translations(p_lang text, p_id uuid) postgres
5100; 826 16600 DEFAULT ACL private DEFAULT PRIVILEGES FOR TABLES postgres
5101; 826 16601 DEFAULT ACL public DEFAULT PRIVILEGES FOR FUNCTIONS supabase_admin
`;

test("replays ACLs on public/private objects and the private schema, never auth's", () => {
  const lines = aclTocLines(TOC);
  assert.deepEqual(lines.map((l) => l.split(";")[0]), ["5000", "5001", "5002", "5003", "5005", "5100"]);
});

test("default privileges are replayed only for postgres (a non-superuser cannot set another role's)", () => {
  const lines = aclTocLines(TOC);
  assert.ok(lines.some((l) => l.startsWith("5100;")));
  assert.ok(!lines.some((l) => l.startsWith("5101;")));
});

test("aclObject folds a function's arguments and keys views as tables", () => {
  assert.equal(aclObject("GRANT ALL ON FUNCTION private.works_with_residents() TO authenticated;"), "FUNCTION private.works_with_residents");
  assert.equal(aclObject("GRANT ALL ON FUNCTION public.approved_translations(p_lang text, p_id uuid) TO anon;"), "FUNCTION public.approved_translations");
  assert.equal(aclObject("GRANT SELECT ON TABLE private.resident_current_state TO authenticated;"), "TABLE private.resident_current_state");
  assert.equal(aclObject("GRANT USAGE ON SCHEMA private TO authenticated;"), "SCHEMA private");
});

test("archiveObjects lists every public/private object in the TOC, including ones with no ACL entry", () => {
  const k = archiveObjects(TOC);
  for (const x of ["TABLE public.residents", "TABLE private.resident_current_state", "FUNCTION private.works_with_residents", "FUNCTION public.shelter_today", "SCHEMA private", "SCHEMA public"]) {
    assert.ok(k.has(x), x);
  }
  assert.ok(!k.has("TABLE auth.users"));
});

const ARCHIVE = `
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT SELECT ON TABLE private.resident_current_state TO authenticated;
REVOKE ALL ON FUNCTION private.works_with_residents() FROM PUBLIC;
GRANT ALL ON FUNCTION private.works_with_residents() TO authenticated;
GRANT SELECT ON TABLE public.residents TO authenticated;
GRANT SELECT ON TABLE auth.users TO postgres;
`;

test("an exact match reports nothing missing or extra", () => {
  const r = compareAcls(ARCHIVE, ARCHIVE, TOC);
  assert.deepEqual([r.missing, r.extra, r.newer], [[], [], []]);
  assert.equal(r.matched, 5); // auth's line is out of scope
});

test("the --no-privileges shape is caught both ways: private missing, public over-granted", () => {
  const target = `
GRANT SELECT ON TABLE public.residents TO authenticated;
GRANT ALL ON TABLE public.residents TO authenticated;
GRANT ALL ON FUNCTION public.shelter_today() TO authenticated;
`;
  const r = compareAcls(ARCHIVE, target, TOC);
  assert.equal(r.missing.length, 4);
  assert.deepEqual(r.extra.sort(), [
    "GRANT ALL ON FUNCTION public.shelter_today() TO authenticated;",
    "GRANT ALL ON TABLE public.residents TO authenticated;",
  ]);
});

test("an object the backup does not hold (a newer migration's) is reported apart, not as extra", () => {
  const r = compareAcls(ARCHIVE, ARCHIVE + "GRANT SELECT ON TABLE public.suppliers TO authenticated;\n", TOC);
  assert.deepEqual(r.extra, []);
  assert.deepEqual(r.newer, ["GRANT SELECT ON TABLE public.suppliers TO authenticated;"]);
});

test("aclStatements keeps GRANT, REVOKE and ALTER DEFAULT PRIVILEGES lines only", () => {
  const s = aclStatements("SET search_path = '';\n--\nGRANT X ON TABLE public.a TO b;\r\nALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA private GRANT SELECT ON TABLES TO authenticated;\n");
  assert.equal(s.length, 2);
});

test("resetSql leaves the public schema's own USAGE grants alone and skips extension members", () => {
  const sql = resetSql();
  assert.match(sql, /nspname <> 'public'/);
  assert.match(sql, /deptype = 'e'/);
  assert.match(sql, /grant execute on %s %s to public/);
});

test("given the backup's objects, the reset touches only those (a newer migration's objects keep their grants)", () => {
  const sql = resetSql(["public", "private"], archiveObjects(TOC));
  assert.match(sql, /'public\.residents'/);
  assert.match(sql, /'private\.works_with_residents'/);
  assert.doesNotMatch(sql, /suppliers/);
  assert.match(sql, /c\.relkind = 'S' and false/); // the TOC holds no sequence: none is reset
});
