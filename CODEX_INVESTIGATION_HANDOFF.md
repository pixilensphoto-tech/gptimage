# Codex async generate handoff

## What changed
- Replaced `src/app/api/codex/generate/route.ts` synchronous proxy behavior with async job submission returning `202`.
- Added polling endpoint at `src/app/api/codex/generate/[id]/route.ts`.
- Added in-memory job runner in `src/lib/codexJobs.ts`.
- Updated `src/app/codex/page.tsx` to submit once and poll job status.
- Left `/api/codex/tryon` unchanged on purpose.

## Current status
- The original Cloudflare `524` issue on `gptimage.pixilens.app/api/codex/generate` is addressed architecturally by avoiding one long browser request.
- Localhost flow now returns `202` immediately and polls correctly.
- At least one localhost run against the live Azure backend succeeded end-to-end and returned a final image URL.
- Another run previously failed late with `fetch failed`.
- After improving diagnostics in `src/lib/codexJobs.ts`, the latest repro did not fail fast; it remained stuck at job status `running`, progress `90`, message `Still generating image` for several minutes.

## Important files
- `src/app/api/codex/generate/route.ts`
- `src/app/api/codex/generate/[id]/route.ts`
- `src/app/codex/page.tsx`
- `src/lib/codexJobs.ts`
- `README.md` (deployment caveat for Coolify)

## Latest diagnostic finding
The remaining issue looks more like a hanging downstream request to `${CODEX_API_URL}/v1/generate` than a client-side polling bug.

Evidence:
- Browser submit path is healthy.
- Poll endpoint keeps returning `200`.
- Job reaches `running` and advances to `90%` via heartbeat.
- Latest repro stayed pinned at `90%` instead of transitioning to `failed`.

## Latest repro details
- Local page: `http://localhost:3000/codex`
- Job id from latest hanging repro: `18d26f32-391c-44d8-a85f-b19d9e38a01d`
- Latest direct localhost status check returned:
  - `{"id":"18d26f32-391c-44d8-a85f-b19d9e38a01d","status":"running","progress":90,"message":"Still generating image"}`

## Code detail already added for diagnostics
`src/lib/codexJobs.ts` now expands nested fetch causes with `describeCodexError(error)` and clears the heartbeat in `finally`, so future transport failures should be more readable instead of collapsing to just `fetch failed`.

## Next steps
1. Reproduce again and inspect the local dev server log for the expanded `[codex job ...]` error output if the job fails.
2. Add an explicit timeout/abort to the downstream fetch in `src/lib/codexJobs.ts` so hung upstream requests become controlled failures instead of endless `running` jobs.
3. Compare a hanging localhost job with a direct call to `https://codeximageapi-az.pixilens.online/v1/generate` using the same payload to determine whether the hang is upstream-specific or proxy/runtime-specific.
4. Once the hanging/failure mode is understood, deploy carefully using the repo `README.md` Coolify notes.

## Operational notes
- `.env.local` currently contains live backend URL/key for local testing. Do not commit it.
- The normal generate pipeline was the only intended scope. Try-on was intentionally deferred.
