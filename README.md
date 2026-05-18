# GPT Image Studio

Public Pixilens image-generation app for `gptimage.pixilens.app`.

## Local development

```bash
cp .env.example .env.local
npm install --legacy-peer-deps
npm run dev
```

Required environment variables:

- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_DEPLOYMENT`
- `AZURE_OPENAI_API_VERSION`

The Azure key must stay in local/Coolify environment variables and must not be committed.

## Coolify Deployment

- **Server:** Priyanka (`ssh priyanka`)
- **Coolify App ID:** 37, UUID `vgssg8okkk44swoc80gwckoo`
- **Domain:** `gptimage.pixilens.app`
- **Build pack:** Dockerfile (port 3000)
- **Config dir:** `/data/coolify/applications/vgssg8okkk44swoc80gwckoo/`

### Known Deployment Drift: stale host compose can override Coolify

This app must be left on the normal Coolify-managed Dockerfile deployment path. A previous host-side workaround in `/data/coolify/applications/vgssg8okkk44swoc80gwckoo/post-deploy.sh` re-ran `docker compose up` from the persistent config directory after each deployment.

That recovery script eventually became the real problem: it recreated an old manually-pinned container from the host `docker-compose.yaml`, including stale Traefik/Caddy labels, after Coolify had already completed a successful rollout.

Symptoms:

- Coolify deployment shows `finished` for the correct commit.
- `SOURCE_COMMIT` in `/data/coolify/applications/vgssg8okkk44swoc80gwckoo/.env` is current.
- `docker ps` still shows an old container such as `gptimage-manual-test:latest`.
- The app may still respond on `gptimage.pixilens.app`, but it is being served by the stale container instead of the repo-backed rollout.

How it was confirmed:

- `post-deploy.sh` contained `docker compose up -d` recovery logic.
- `/var/log/gptimage-watchdog.log` showed that script recreating the stale container from the host compose directory.
- Coolify deployment logs showed normal rollouts creating and removing repo-backed containers, which proved the lingering runtime was outside the intended rollout lifecycle.

Current fix:

- Disable the host recovery hook by replacing `/data/coolify/applications/vgssg8okkk44swoc80gwckoo/post-deploy.sh` with:

```sh
#!/bin/sh
exit 0
```

- Trigger a fresh Coolify deployment.
- Remove any lingering stale container manually if it still exists after the clean rollout.

### Deployment status lag note

Coolify deployment rows can remain `in_progress` even after the live site is already serving the new runtime. On 2026-05-17, deployment `r0o0sgo08wc04sckk0s840gs` for commit `1d3f6c0928fe90d9936e20afb26de358f181097a` still showed `in_progress` while the production `/outfitchange` → `/images` flow had already succeeded and the latest gallery row updated from placeholder to `Try-on image ready`.

Treat the live app behavior as authoritative when this happens:

- verify the intended commit is attached to the latest deployment row
- validate the production site directly in the browser
- confirm the generated gallery row reaches its final state after refresh

Do not assume a still-`in_progress` Coolify row means the app patch failed if the browser-validated production behavior has already updated.

### Proven redeploy path

Use the host Coolify CLI directly instead of guessing at container-internal commands.

```bash
# Queue a fresh deployment for the app
ssh priyanka "/home/priyanka/go/bin/coolify --context Coolify1 app restart vgssg8okkk44swoc80gwckoo"

# Confirm the newest deployment row and commit
ssh priyanka "sudo docker exec coolify-db psql -U coolify -d coolify -c \"SELECT created_at, deployment_uuid, status, commit FROM application_deployment_queues WHERE application_id = '37' ORDER BY created_at DESC LIMIT 10\""

# Follow logs for the latest deployment UUID if needed
ssh priyanka "/home/priyanka/go/bin/coolify --context Coolify1 app deployments logs vgssg8okkk44swoc80gwckoo <deployment-uuid>"
```

On 2026-05-17 this exact path produced deployment `dwgss008cwcckw4gggw4040c`, which finished on commit `121a7b8e2f6f549bbd8d09f4c49f586ad5954703` and matched the live site.

After the DB row reaches `finished`, verify the production pages in a browser instead of trusting Coolify status alone:

- `/codex`
- `/outfitchange`
- `/images`

### Debugging

```bash
# Check latest deployments
ssh priyanka "/home/priyanka/go/bin/coolify --context Coolify1 app deployments list vgssg8okkk44swoc80gwckoo --format json"

# Check what is actually serving the app
ssh priyanka "sudo docker ps --format '{{.Names}}|{{.Image}}|{{.Status}}' | grep 'vgssg8okkk44swoc80gwckoo'"

# Inspect the host-side hook
ssh priyanka "sudo sed -n '1,120p' /data/coolify/applications/vgssg8okkk44swoc80gwckoo/post-deploy.sh"

# Check whether the old watchdog recreated anything
ssh priyanka "sudo tail -20 /var/log/gptimage-watchdog.log"

# Inspect labels on a suspicious container
ssh priyanka "sudo docker inspect <container-name> --format '{{json .Config.Labels}}'"

# Remove a stale container after the hook has been disabled
ssh priyanka "sudo docker stop -t 30 <container-name> && sudo docker rm -f <container-name>"

# View deployment rows in Coolify DB
ssh priyanka "sudo docker exec coolify-db psql -U coolify -d coolify -c \"SELECT created_at, deployment_uuid, status, commit FROM application_deployment_queues WHERE application_id = '37' ORDER BY created_at DESC LIMIT 10\""
```

### Try-On API Route

`/api/codex/tryon` proxies to `https://codeximageapi.pixilens.online/v1/generate` (NOT the Azure host). The `CODEX_TRYON_API_URL` env var is optional — it defaults to that URL. The `CODEX_API_KEY` env var is required.
