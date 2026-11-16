# Financial Video API — V1

A **local-first, mobile-oriented** REST API that converts two financial JSON reports and a qualitative household persona into a fact-grounded vertical MP4 video.

## Current status

- ✅ Validates the sample v2 JSON contract and household identity
- ✅ Extracts financial facts, records origin and interpretation, and rejects conflicting duplicate values
- ✅ Uses the **team AI key in server-side `.env`** with the Sherpaswealth OpenAI-compatible LLM proxy; clients send only three files
- ✅ Generates a constrained storyboard and checks numeric placeholders
- ✅ Generates ElevenLabs speech with duration information; optional Eleven Music soundtrack
- ✅ Renders a 1080 × 1920 H.264 video using Remotion
- ✅ Provides an in-memory job queue, status endpoint, and MP4 download endpoint
- ✅ Has an **offline visual demo mode** (no AI, no generated narration/music)

**Important:** The API has not been deployed or live-tested against external API keys in this template. Do not use this development MVP for real confidential financial clients. The numerical controls reduce hallucinations but do **not** formally guarantee that every narrative interpretation is accurate. Human review is recommended before real-world financial distribution.

## Environment and installation

Prerequisites: Node.js 20.11+ (Node 22 LTS recommended), npm, Git. Remotion needs a browser and FFmpeg support; its renderer may need a browser installation on first use. Supported environment: local Windows/macOS/Linux with Chromium available.

```powershell
# In the project root
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run typecheck
npm test
npm run dev
```

If PowerShell reports `Copy-Item` is unsupported, you're using another shell. In Bash use `cp .env.example .env`.

Check the API: http://127.0.0.1:3000/health

### Render your first MP4 **without** external AI keys

Keep `.env` as:

```dotenv
DEMO_MODE=true
GENERATE_MUSIC=false
```

Use the **synthetic** sample documents supplied in `examples/`:

```powershell
$result = curl.exe -s -X POST http://127.0.0.1:3000/api/v1/videos `
  -F "financialHealth=@examples/financial-health.json" `
  -F "investmentAnalysis=@examples/investment-analysis.json" `
  -F "persona=@examples/persona.md" | ConvertFrom-Json

$result
$jobId = $result.jobId
Invoke-RestMethod "http://127.0.0.1:3000/api/v1/videos/$jobId"
```

Call the status endpoint until `status` equals `completed` (otherwise you'll receive HTTP 409 when downloading).

```powershell
Invoke-WebRequest "http://127.0.0.1:3000/api/v1/videos/$jobId/download" -OutFile "example-video.mp4"
```

Demo mode **does not speak**. It renders captions and animations, and is meant to verify the pipeline without using paid external APIs.

### Generate a personalized silent video with the hackathon LLM proxy

Set:

```dotenv
DEMO_MODE=false
LLM_BASE_URL=https://llm-hackathon.sherpaswealth.com/v1
LLM_API_KEY=your_TEAM_ai_key
LLM_MODEL=deepseek-flash
LLM_JSON_MODE=false
LLM_MAX_ATTEMPTS=1
AUDIO_MODE=none
GENERATE_MUSIC=false
```

Do not put the personal MCP token in `LLM_API_KEY`; the team LLM key is different.

Test the proxy with a single small paid call:

```powershell
npm run llm:check
```

Restart the server (`npm run dev`), then submit **the same multipart request as the demo** (no extra API-key header). When the job completes, download the MP4. This uses the hackathon LLM for the story, but keeps audio silent until an ElevenLabs path is set up.

To use **direct ElevenLabs** for voice, set `AUDIO_MODE=elevenlabs`, `ELEVENLABS_API_KEY=...`, and `ELEVENLABS_VOICE_ID=...`. The organizers' proxy lists ElevenLabs voice model IDs, but its API path and compatibility with our existing ElevenLabs timestamps endpoint were **not provided**. This starter does not yet route ElevenLabs via the hackathon proxy. Music also requires direct ElevenLabs support and is disabled by default.

Read [Hackathon proxy guide](docs/HACKATHON-PROXY.md) for model selection, rate/credit limits, voice limitations, and detailed troubleshooting.

## API contract

| Endpoint | Meaning |
|---|---|
| `GET /health` | Health check |
| `POST /api/v1/videos` | Multipart files `financialHealth`, `investmentAnalysis`, `persona`; team LLM key is configured on the server |
| `GET /api/v1/videos/:jobId` | Poll job state: queued, generating_audio, generating_music, rendering, completed, failed |
| `GET /api/v1/videos/:jobId/download` | Returns MP4 when completed |

`POST` returns HTTP 202 with `{jobId,status,statusUrl}`. The endpoint performs **LLM storyboard generation before returning 202** in live mode, so the initial request can be relatively slow. An external client must set a generous timeout.

The resulting video is **1080 × 1920, 9:16, 30 fps, max 180 seconds**. When `AUDIO_MODE=none`, the job uses estimated scene timing, captions, and no narration/audio charges. A job fails when synthesized audio exceeds the duration limit; it is never silently trimmed. Optional music failure is a non-fatal warning.

## Source modules

| Directory | Responsibility |
|---|---|
| `src/validation` | Uploaded document contract, version / household checks |
| `src/financial` | Fact Registry and cross-checks |
| `src/storytelling` | Qualitative persona extraction, LLM, output schema and grounded placeholders |
| `src/audio` | ElevenLabs TTS and instrumental music |
| `src/video` | Remotion animations and server renderer |
| `src/jobs` | Local background queue with progress |
| `src/api` | Fastify HTTP routes |
| `examples` | Sample synthetic data only |
| `tests` | Source data and LLM-output validation |

### Financial accuracy policy

- The JSONs are the ONLY source of displayed financial figures; persona contains **no authoritative financial data**.
- Fact references look like `{{fact:cash.accessible}}`. TypeScript substitutes vetted values before narration and rendering.
- Cross-file collisions on overlapping authoritative facts cause the API to reject the documents.
- The LLM is instructed to avoid numeric text outside fact placeholders, and the server rejects digits, currencies, and common English number words outside the placeholders.
- The system **does not** verify the semantic truth of every qualitative sentence. It does not provide a guarantee of suitability, completeness, or accuracy. This is a necessary follow-up before real financial use.
- Source JSON narratives include analyst-produced recommendations; the LLM should explain them, not manufacture new recommendations.

## Git / GitHub workflow: from first commit through merge

1. Initialize Git on your **existing** project folder if necessary:

   ```powershell
   git status                 # If 'not a git repository', run the next command
   git init -b main
   ```

2. Make an initial commit with your existing skeleton (or use this ready-made starter as your initial milestone). Check `.env` is ignored:

   ```powershell
   git check-ignore .env
   git add .
   git status
   git commit -m "chore: initialize TypeScript API"
   ```

3. Create your first working branch **before making your next code change**:

   ```powershell
   git switch -c feat/financial-contracts
   # Edit src/validation, src/financial, tests
   npm run typecheck
   npm test
   git add src/validation src/financial tests
   git commit -m "feat: validate reports and extract authoritative facts"
   ```

4. Merge back to main:

   ```powershell
   git switch main
   git merge --no-ff feat/financial-contracts
   git branch -d feat/financial-contracts
   ```

5. Repeat with new feature branches (`feat/storytelling`, `feat/audio-video`, `feat/api-endpoints`). Commit only after testing that feature. Keep unrelated changes on other branches.

6. On GitHub, create a new **empty** repository called `financial-video-api`, then:

   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/financial-video-api.git
   git push -u origin main
   ```

   For GitHub pull requests instead of local merges, push your feature branch with `git push -u origin feat/financial-contracts`, create a PR targeting `main`, merge it on GitHub, then `git switch main; git pull --ff-only`.

**Note:** If you copied this starter project with *all its source files already present* and committed them as the initial version, don't create fake feature commits for unchanged code. Start a new branch for the next actual change, such as improved captions or additional validation.

## MVP limitations and next steps

- In-memory job records disappear on server restart. Generated videos remain in `output/`, but the job index does not.
- No authentication, rate limiting, authorization, or secure private-download system. `/internal-assets` is for local rendering only.
- It has a sequential local worker, not a production queue. The first submission does the LLM call synchronously.
- The persona parser currently targets the sample's qualitative `classification` code block; later reports will need compatible fields or an adapter.
- This starter is English-language with an intentionally simple set of animation templates. No advanced word-by-word subtitle timing yet.
- The duration cap is enforced after synthesis. A too-long narration currently fails rather than automatically rewriting/retrying.
- Remotion/ElevenLabs licenses and commercial music usage must be verified before deployment to paying clients.
- The input schema validates the required data used by this engine; it does not recursively validate every field of the original very large reports.
- `output/` files are retained indefinitely until you manually delete them.

### Suggested next improvements

1. Run and confirm demo MP4 on your Windows machine.
2. Test the hackathon proxy with `npm run llm:check`, then generate an LLM-personalized silent MP4.
3. Verify the hackathon audio API documentation, or configure direct ElevenLabs to add narration. Then improve visual compositions and captions.
4. Introduce privacy, authentication, storage retention, durable jobs and review controls before production.
