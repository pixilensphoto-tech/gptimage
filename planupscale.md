# Plan: gallery AI upscale

## Current state
- `/images` now shows an `AI Upscale` button on gallery cards.
- Clicking it creates a new `upscale` placeholder row in the shared gallery.
- `gptimage` no longer performs the RunningHub upscale workflow directly.
- `src/lib/upscaleJobs.ts` now mirrors the try-on async architecture by submitting to `codeximageapi`, then polling upstream status and syncing the gallery row.
- Local config was corrected so `CODEX_TRYON_API_URL` points at the local `codeximageapi` server on `http://localhost:8787` during testing.
- The local runtime also picks up `IMGBB_API_KEY`, so the older missing-key failure is no longer the current blocker.

## Verified blocker
- The remaining blocker is now upstream in `codeximageapi`, not in `gptimage`.
- The local `/v1/upscale` and `/v1/upscale/:id` routes exist and the gallery can queue placeholders successfully.
- Source image preparation and RunningHub upload progress begin upstream, but the workflow cannot be created until the correct RunningHub input mapping is configured.
- The current local upstream error is: `RUNNINGHUB_UPSCALE_NODE_IMAGE is not configured`.
- A wide local probe of candidate node ids did not yet find a valid input node for workflow `2056175041569673218`.
- This means the next unblock is discovering the correct RunningHub node id, and field name if it is not `image`.

## Working reference flow
- The try-on pipeline already uses a proven async pattern.
- `gptimage` sends a request to `codeximageapi`.
- `codeximageapi` handles the long-running pipeline work and returns async job state.
- `gptimage` polls status and updates the gallery row.

## Recommended next implementation
1. Discover the correct RunningHub input node id for workflow `2056175041569673218` and set `RUNNINGHUB_UPSCALE_NODE_IMAGE` in the local `codeximageapi` environment.
2. If the workflow expects a different field key, set `RUNNINGHUB_UPSCALE_FIELD_IMAGE` to the accepted field name instead of the current `image` default.
3. Restart local `codeximageapi` after updating that config.
4. Re-run `AI Upscale` from `/images` against the local upstream and confirm the placeholder moves through upstream async status instead of failing during workflow creation.
5. Verify the final result is uploaded to ImgBB, synced back into the gallery row, and preserves delete metadata so gallery delete remains compatible.

## Why this approach
- It matches the already-working try-on flow.
- It avoids guessing at the direct RunningHub create payload from the frontend app.
- It keeps third-party workflow specifics centralized in `codeximageapi`.
- It reduces duplicated pipeline logic across repos.

## Validation after implementation
- Queue `AI Upscale` from a succeeded gallery image.
- Confirm the placeholder appears in `/images`.
- Confirm the local upstream job advances past workflow creation instead of failing with `RUNNINGHUB_UPSCALE_NODE_IMAGE is not configured`.
- Confirm the gallery row continues progressing through the upstream async status sync.
- Confirm the row reaches `succeeded` with a new hosted image URL.
- Confirm metadata includes ImgBB delete information so gallery delete remains compatible.
