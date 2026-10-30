# Running the assistant's model on your own computer

For Lutan. Plain steps, in order. Nothing here costs money, and nothing you type
leaves your own machine. **Do not start until you have time for a big download
(several gigabytes).**

The model runs on hardware you own. Renting a cloud computer, using a hosted
open model, and using Claude's service are all ruled out.

## What you are setting up

A small program called **Ollama** that runs an AI model on a computer. The shelter
app asks it questions through your own network. If it is switched off or
unreachable, **the assistant still works the old way** (the keyword reader). The
model only adds understanding on top.

## Step 1. Install Ollama (the laptop)

1. Go to **ollama.com/download** and download the Windows installer.
2. Run it and click through. It starts itself in the background.
3. Open **PowerShell** and type:

```powershell
ollama --version
```

You should see a version number. If you see "not recognised", close PowerShell,
open a new one and try again.

## Step 2. Download a model

Models are chosen from the replay's numbers, not here. Try them **in this order**,
one at a time (each is a separate download; none is declared the winner):

| Order | Name to type | Download | Why it is on the list |
|---|---|---|---|
| 1 | `qwen3:8b` | about 5 GB | Built for calling tools, small enough for 16 GB of memory. |
| 2 | `llama3.1:8b` | about 5 GB | Widely used, well known for calling tools. |
| 3 | `mistral-nemo` | about 7 GB | A bigger 12B model with tool calling. A squeeze on this laptop. |

Sizes are approximate and the Ollama website is the authority. To download the first:

```powershell
ollama pull qwen3:8b
```

You should see a progress bar that ends with `success`.

## Step 3. Check it answers

```powershell
ollama run qwen3:8b "Say hello in five words"
```

A short sentence comes back. **On this laptop the first answer can take half a
minute or more. That is normal.** Type `/bye` to leave.

Then check the address the app will use, which is the same server:

```powershell
curl.exe http://localhost:11434/v1/models
```

You should see text containing `qwen3:8b`.

## Step 4. Tell the app to use it

Open the file `.env.local` in the app's folder and add these lines (the first two
are required; leave the others out):

```
ASSISTANT_LLM_PROVIDER=openai-compatible
ASSISTANT_LLM_MODEL=qwen3:8b
```

Only if you need them:

```
ASSISTANT_LLM_BASE_URL=http://localhost:11434/v1
ASSISTANT_LLM_TIMEOUT_MS=180000
```

`ASSISTANT_LLM_TIMEOUT_MS` is how long the app waits for an answer, in thousandths
of a second. 180000 is three minutes, chosen because a laptop with no graphics
card is slow to start. Raise it if you see "did not answer within" messages.
**It governs the replay (`scripts/assistant-eval-replay.mjs`), not the app:** the app
gives the model at most 25 seconds a step and then lets the keyword reader answer,
whatever this says. On this laptop the model will often be slower than that, so
the app will mostly answer the old way here; the replay is how to judge a model on
it. The gaming PC's graphics card is what brings a step under 25 seconds.

Then restart the app (stop and start `next dev`). To go back, delete the two lines.

## What a problem looks like

| You see | It means | Do this |
|---|---|---|
| "could not be reached … Is it running?" | Ollama is not running. | Start **Ollama** from the Start menu, or run `ollama serve`. |
| "does not know …" | That model is not downloaded. | Run `ollama pull` with the same name as `ASSISTANT_LLM_MODEL`. |
| "did not answer within N seconds" | Too slow for the wait you set. Seen in the replay, not the app. | Raise `ASSISTANT_LLM_TIMEOUT_MS` for the replay, or try a smaller model. |
| "was not valid JSON" | The model garbled its answer. Small models do. | Nothing to fix; the keyword reader answers. Tell whoever reads the replay. |

## The live shelter app: the Pi asks the model, across your home network

**No tunnel is needed.** The live app is drawn by the **Pi**, not by Cloudflare:
Cloudflare only passes each request through the Pi's tunnel and takes over when the
Pi is down (`docs/pi-hosting.md`). So the question goes from the Pi to the model
machine across your own home network, and the text people type never leaves your
house on its way to the model. Only while the Pi is down does Cloudflare draw the
page, and then the keyword reader answers, the same as when the model machine is
off. Why this and not a second tunnel: `docs/decisions/2026-10-30-assistant-local-model-reachable.md`.

**Before you start:** the model machine must be on the **same home network as the
Pi**. On the model machine, in PowerShell:

```powershell
ping lanna-pi.local
```

You should see `Reply from 192.168.68.102` (or another `192.168.68.` address). If
it says it could not find the host, the two are not on the same network: stop here
and ask Claude.

### Step 5. Let Ollama answer the network, not just its own machine

Out of the box Ollama only answers the computer it runs on. On the model machine,
in PowerShell:

```powershell
setx OLLAMA_HOST 0.0.0.0:11434
```

You should see `SUCCESS: Specified value was saved.` Then **quit Ollama** (right-click
its llama icon by the clock, **Quit Ollama**) and start it again from the Start menu.
If Windows asks whether to let Ollama through the firewall, tick **Private networks**
only and click **Allow**.

### Step 6. Let the Pi through the firewall

Open PowerShell **as administrator** (right-click PowerShell, **Run as administrator**)
and type:

```powershell
New-NetFirewallRule -DisplayName "Ollama from the Pi" -Direction Inbound -Protocol TCP -LocalPort 11434 -RemoteAddress 192.168.68.102 -Action Allow
```

You should see a block of text that includes `Status : The rule was parsed successfully from
the store.` This lets the Pi, and only the Pi, ask the model.

### Step 7. Give the model machine an address that does not change

Your router hands out addresses and can change them. In the router's app, find the
model machine in the list of devices and choose **reserve address** (the wording
differs by router). Write the address down; it looks like `192.168.68.50`. **This is
a change to your router, so it is yours to make.**

### Step 8. Check the Pi can reach the model

From this computer:

```powershell
ssh lutan@lanna-pi.local
```

Then on the Pi, with your model machine's address in place of `192.168.68.50`:

```bash
curl -s http://192.168.68.50:11434/v1/models
```

You should see text containing `qwen3:8b` (or whichever model you pulled). If nothing
comes back for ten seconds, the model machine is asleep or Step 5 or 6 did not take.

### Step 9. Tell the live app to use it

Still on the Pi, open the Pi's own settings file:

```bash
nano ~/Animal_Shelter_App/.env.deploy.production
```

Add these three lines at the bottom, with your address:

```
ASSISTANT_LLM_PROVIDER=openai-compatible
ASSISTANT_LLM_MODEL=qwen3:8b
ASSISTANT_LLM_BASE_URL=http://192.168.68.50:11434/v1
```

Save with **Ctrl+O**, **Enter**, then leave with **Ctrl+X**. Then:

```bash
cd ~/Animal_Shelter_App && ./scripts/pi/deploy-pi.sh
```

It ends by restarting the app. **Put these lines in the Pi's copy only, never in the
copy on this computer**: that one is uploaded to Cloudflare, which cannot reach your
house and would make people wait for a model it can never find while the Pi is down.

To go back, delete the three lines and run `deploy-pi.sh` again.

**What you should see:** the Step 8 check answering is the proof the road is open.
In the app, the assistant still answers every sentence. The app does not yet show
whether the model or the keyword reader answered a sentence; it records the model's
name on each confirmed change, but no screen shows it yet.

## What happens when the machine is off

**Measured on 2026-10-30** with the app's own code, on Node as the Pi runs it:

| The model machine is | The assistant waits | Then |
|---|---|---|
| On, with Ollama running | the model's own time, at most 25 seconds a step | the model's draft |
| On, Ollama not running | about a fifth of a second | the keyword reader answers |
| Asleep or switched off | about 11 seconds | the keyword reader answers |
| Too slow (over 25 seconds a step) | 25 seconds | the keyword reader answers |

So nothing ever stops, but **while the machine sleeps every sentence waits about
11 seconds** before the keyword reader answers. The app does not yet remember that
the model was missing a moment ago.

The planned host is a gaming PC that is often asleep. Three choices, **yours to
make**; none is set up:

1. **Leave it on.** Always available; uses power and is on all night.
2. **Wake it over the network** when the app needs it. Works, but the first
   request waits for it to wake and the setup is fiddly.
3. **Accept that it is sometimes unavailable.** The keyword reader still answers,
   so nothing stops; the cost is the 11-second wait above. **Recommended as the safe
   default**, and the one that needs no setup.

## What the swap changes in the prompt

Each question carries 12 tool descriptions, about 6,600 characters (roughly 1,700
to 2,200 tokens, an estimate not a count by the model's own tokenizer). On a laptop
without a graphics card that reading time is most of the wait.
