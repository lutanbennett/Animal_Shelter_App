# 2026-11-06: a documented stand-in model for dev (`#m4t8q`)

**Step zero.** Not already built: `ASSISTANT_LLM_MODEL` is read only by `llm.ts` / `llm-openai.ts`; no decision named a dev route.
Measured on this laptop: Ollama is not installed (no `ollama` on the path, nothing on :11434) and dev's `.env.local` has no `ASSISTANT_*`.
The `assistant-v2-tools` scratchpad server did not survive: no file mentioning `chat/completions` exists in the repo or in
the scratchpads searched. Next reads the process environment before `.env.local`, so values set on the child win.

**Chosen.** `scripts/dev-assistant-model.mjs`: a scripted OpenAI-compatible server (plain `node:http`, no dependency) plus a
`--dev` switch that starts `next dev` already pointed at it. Documented in `docs/dev-assistant-model.md`, cited from `CLAUDE.md`.
A scripted stand-in rather than Ollama because Ollama is not installed, a model download is Lutan's step, and a canned tool
call is what a save path or a failure notice needs.

**Caveat settled.** Good for a save path and a failure notice; not for judging whether the assistant understands a sentence. Written in the doc.

**Followed, and seen.** `--dev --force-tag-failure denied` on :3007; a login with `assistant, residents, view_residents` got the
card for *Butter (R-0041) 4.2 kg* with "Also tag #Angsumalin", and Confirm gave "Your cards don't let you make this change" (no `medical.weight`
write, which is the doc's step about `medical_records`). Re-signed with `medical_records` added: *"Done — Butter (R-0041) recorded at 4.2 kg on 6 Nov 2026.
The note was saved, but your cards do not let you link residents in it, so the tagged residents were not linked."* That is the notice, on a screen.

**No app change.** Nothing under `src/`. Release note: n/a, developer-only.

**Found, not fixed.** The tag notice only reads sensibly as "denied" here; `failed` was not driven.
