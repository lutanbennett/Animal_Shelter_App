# How the live app reaches a model on Lutan's own machine: through the Pi, no tunnel

2026-10-30, `claude/assistant-local-model-reachable`. Backlog item *THE WORKER CANNOT REACH A MODEL
ON LUTAN'S OWN MACHINE*. The in-house rule (the model runs on hardware Lutan owns, nothing hosted) is
settled on its own item and is not reopened here.

## The question was framed one step off

#1118 reasoned that *the Worker* cannot reach a home address, and so a Cloudflare tunnel to the model
machine would be needed. But in production the Worker does not run the assistant. `worker/index.mjs`
replays every request to the Pi through its tunnel (`ORIGIN_HOST`, `worker/origin.mjs`) and renders
it itself only when the Pi does not answer. The assistant's model call is a server action
(`src/app/assistant/interpret.ts`), so it runs **on the Pi**, a Node process on Lutan's home network.
The Pi can reach a machine beside it directly.

## What was measured, and how

| Test | Method | Result |
|---|---|---|
| Is the Pi on the same network as this PC? | `ping lanna-pi.local` from this PC | Reply from `192.168.68.102`; this PC is `192.168.68.73` |
| Model machine **off** (nothing listening) | the real `createOpenAiAdapter().complete()` in Node, base URL `http://127.0.0.1:11434/v1` | `unavailable` after **0.2 s** |
| Model machine **asleep** (no host at the address) | same, base URL `http://192.168.68.250:11434/v1`, an address that does not answer ping | `unavailable` after **10.7 s** (Node's own connect timeout) |
| Replay (#1116) meets the adapter (#1118) | the real `scripts/assistant-eval-replay.mjs` CLI, `ASSISTANT_LLM_PROVIDER=openai-compatible`, pointed at a stub HTTP server speaking Ollama's shape | Report produced, exit 0. The server received `/v1/chat/completions`, 12 tools, `tool_choice: auto`, roles system+user. A garbled argument string scored as a model error, not a crash. Now a test: `scripts/assistant-eval-replay.test.mjs` |
| **Can the Worker runtime reach a home address?** | a throwaway Worker run as a `wrangler dev --remote` preview (code on Cloudflare's edge, nothing deployed), fetching `localhost:11434`, this PC's LAN address, the router and `lanna-pi.local`, with `https://example.com/` as a control | **Not established.** The preview uploaded and never answered, **not even the control**, so it says nothing about the targets. The wrangler sign-in on this PC has read-only scopes (`user (read)`, `account (read)`), the likely reason. Re-running it needs Lutan to sign wrangler in again with write scope; not done, because that is his account. |

What the tests cannot cover: a real model, a real gaming PC waking from sleep (a machine that sleeps
with its network card answering may fail faster or slower than 10.7 s), and the Windows firewall on
that PC. The Worker question stays reasoned: a Worker runs in Cloudflare's data centres, where
`localhost` is the Worker itself and `192.168.x.x` is no one's home. **It no longer matters for the
design below**, which never asks the Worker to reach the house.

## Options considered

1. **The Pi calls the model across the home network. Chosen and recommended.** Costs nothing, adds
   no program and no Cloudflare setting, and the text people type goes from the Pi to the model
   without leaving the house. Lutan's steps: Ollama listens on the network (`OLLAMA_HOST`), a firewall
   rule letting only the Pi in, a fixed address for the model machine (a router reservation; his
   network, his choice), and three lines in **the Pi's** `.env.deploy.production`. While the Pi is
   down the Worker answers with the keyword reader, which is what happens anyway when the model
   machine is asleep.
2. **A second Cloudflare tunnel on the model machine, as the Pi has.** Would let the Worker reach the
   model too, but only matters while the Pi is down, the rare case. Costs a second `cloudflared` on a
   desktop that sleeps (a 530 on every sleep), a WAF rule or Access token to keep strangers off, and
   Cloudflare's 100-second limit on a proxied request. Not recommended now; this is its shape if
   wanted later, and `ASSISTANT_LLM_BASE_URL` would then also need to reach the Worker (it is now
   registered Pi-only).
3. **Open a port on the router.** Rejected: it opens a door in the home network to the internet.
4. **Run the model on the Pi.** The Pi is too small (runbook).
5. **A private network product (this PC has an address that looks like one, `100.70.x.x`).** Not
   needed while both machines share a network, and a Worker cannot join one anyway.

## The app side: configuration only, plus one honest registry line

No code change was needed: `createLlm()` already reads `ASSISTANT_LLM_BASE_URL`. One correction:
`scripts/lib/runtime-config.mjs` registered `ASSISTANT_LLM_BASE_URL` and `ASSISTANT_LLM_TIMEOUT_MS` as
`where: "both"`. A value that is neither `secret` nor `build` is never sent to the Worker
(`WORKER_OPTIONAL_SECRETS` and `WORKER_BUILD_VARS` both skip it), so "both" claimed something the
deploy never did. They are now `"pi"`. `ASSISTANT_LLM_PROVIDER` and `ASSISTANT_LLM_MODEL` stay "both"
(the Worker can run the Claude implementation); the runbook tells Lutan to put the self-hosted lines in
the Pi's copy only, so the Worker is never pointed at a model it cannot reach.

## What a person sees when the model is not there

Traced from `AssistantConversation.tsx` → `interpretRequest` → `interpretSentence` → the adapter. Every
failure comes back as `{ ok: false }` and the browser runs the keyword parser, so **nothing ever
stops**. The cost is the wait shown as a pending bubble: 0.2 s if Ollama is not running, about 11 s
if the machine is asleep, 25 s if the model is too slow. Acceptable, with two things found and **not
changed** (the conversation code belongs to `claude/assistant-v2-conversation` this batch):

- **Every sentence re-pays the 11-second wait while the machine sleeps.** `modelOff` latches only on
  `not_configured`, not on `unavailable`. Remembering an `unavailable` for a few minutes would make
  option (3) on the hosting item nearly free.
- **The app caps each model step at 25 s** (`MODEL_TIMEOUT_MS` in `src/lib/assistant/interpret.ts`),
  whatever `ASSISTANT_LLM_TIMEOUT_MS` says; that setting only reaches the adapter, so it governs the
  replay. On the i7 laptop (no graphics card, ~1,700-token prompt) a step will often take longer, so
  the app will mostly answer the old way there. The runbook now says so. Four steps of 25 s is also
  exactly Cloudflare's 100-second limit on the request through the Worker. Past it, Cloudflare answers
  524, the server action rejects, and the browser's `.catch` still runs the keyword reader.
- **No screen shows whether the model or the keyword reader answered.** The audit row carries the
  model's name on a confirmed change; `/admin/assistant` does not show it.
