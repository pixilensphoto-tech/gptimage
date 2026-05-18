# Recent fixes

## Gallery-first result flow
- Codex and outfit-change now create durable placeholder rows and send users to `/images`.
- The gallery is the source of truth for pending, processing, success, and failure states.
- Stale page-local result ownership and progress assumptions were removed from the primary flow.

## Gallery deletion
- `/images` supports deleting gallery rows.
- Newer rows preserve ImgBB delete metadata so remote cleanup can happen when available.
- Older rows without ImgBB delete metadata can still be removed locally.

## Codex form fix
- The Codex form now normalizes an empty aspect ratio selection to the default `9:16` ratio instead of submitting an empty string.

## Style-transfer bypass fix
- The chained try-on request now passes the generated Codex image as a hosted URL instead of incorrectly treating it as a data URL.
- This resolved the gallery error: `identityImages[0] must include base64, dataUrl, or path`.

## AI upscale progress
- `/images` now shows an `AI Upscale` button on gallery cards.
- Clicking it creates a new `upscale` placeholder row in the shared gallery.
- Local runtime pickup of `IMGBB_API_KEY` is fixed, so the earlier missing-key failure is no longer the current blocker.

## Current known upscale blocker
- The direct RunningHub implementation inside `gptimage` uploads the source image successfully.
- The job then fails at RunningHub task creation.
- Local Next dev log shows: `RunningHub create failed (HTTP 200)`.
- The next fix should mirror the existing try-on architecture by moving the RunningHub workflow handling into `codeximageapi` and having `gptimage` submit plus poll async status.
