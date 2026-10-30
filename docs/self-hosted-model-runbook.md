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

Then restart the app (stop and start `next dev`). To go back, delete the two lines.

## What a problem looks like

| You see | It means | Do this |
|---|---|---|
| "could not be reached … Is it running?" | Ollama is not running. | Start **Ollama** from the Start menu, or run `ollama serve`. |
| "does not know …" | That model is not downloaded. | Run `ollama pull` with the same name as `ASSISTANT_LLM_MODEL`. |
| "did not answer within N seconds" | Too slow for the wait you set. | Raise `ASSISTANT_LLM_TIMEOUT_MS`, or try a smaller model. |
| "was not valid JSON" | The model garbled its answer. Small models do. | Nothing to fix; the keyword reader answers. Tell whoever reads the replay. |

## The live shelter app (the Cloudflare Worker) cannot see your laptop

Established from how Workers work, not from a test: a Worker runs on Cloudflare's
servers, and `localhost` or a home-network address means nothing to it. So the
steps above work for **development on the same machine**. For the live app the
model has to be reachable from Cloudflare. The shape of the answer, in the order
the repo already points to:

- The shelter already reaches its Raspberry Pi through a Cloudflare **tunnel**
  (a connection the Pi opens outward, so no door is opened in the router;
  see `docs/pi-failover.md`). The same kind of tunnel can publish the model
  machine at an address such as `https://model.<your domain>`, protected so that
  only the Worker can use it. `ASSISTANT_LLM_BASE_URL` then holds that address and
  `ASSISTANT_LLM_API_KEY` the shared secret.
- **Not decided and not built.** It needs a tunnel, an access rule and a check
  that nothing resident-related is stored by the proxy. It is its own piece of work.
- The Pi is too small to run the model itself.

## What happens when the machine is off

The planned host is a gaming PC that is often asleep. Three choices, **yours to
make**; none is set up:

1. **Leave it on.** Always available; uses power and is on all night.
2. **Wake it over the network** when the app needs it. Works, but the first
   request waits for it to wake and the setup is fiddly.
3. **Accept that it is sometimes unavailable.** The keyword reader still answers,
   so nothing stops. **Recommended as the safe default**, and the one that needs no
   setup.

## What the swap changes in the prompt

Each question carries 12 tool descriptions, about 6,600 characters (roughly 1,700
to 2,200 tokens, an estimate not a count by the model's own tokenizer). On a laptop
without a graphics card that reading time is most of the wait.
