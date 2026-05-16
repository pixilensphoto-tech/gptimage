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

### Known Issue: Container Vanishes After Deploy

Coolify runs `docker compose up` inside an ephemeral build container with `--project-directory /artifacts/{deploy-uuid}/`. When that build container is auto-removed (`--rm`), Docker Compose loses the project metadata and garbage-collects the app container and image.

This is a Coolify bug affecting non-build-server dockerfile apps. The compose file IS written to the host config dir, but the compose project was registered with the now-dead artifacts path.

### Watchdog (Automated Fix)

A cron watchdog on the Priyanka server detects when the container or compose project is missing and re-ups from the persistent host compose file.

| Item | Path |
|------|------|
| Cron job | `/etc/cron.d/gptimage-watchdog` |
| Script | `/data/coolify/applications/vgssg8okkk44swoc80gwckoo/post-deploy.sh` |
| Log | `/var/log/gptimage-watchdog.log` |

Runs every minute as root. No manual intervention needed after pushing code and deploying from Coolify UI.

### Debugging

```bash
# Check if container is running
ssh priyanka "sudo docker ps --filter label=coolify.name=vgssg8okkk44swoc80gwckoo"

# Check watchdog log
ssh priyanka "sudo tail -20 /var/log/gptimage-watchdog.log"

# Check compose project is registered
ssh priyanka "sudo docker compose ls | grep vgssg8"

# Manually re-up if needed
ssh priyanka "sudo sh -c 'cd /data/coolify/applications/vgssg8okkk44swoc80gwckoo && docker compose up -d'"

# View deployment logs in Coolify DB
ssh priyanka "sudo docker exec coolify-db psql -U coolify -d coolify -c \"SELECT created_at, status FROM application_deployment_queues WHERE application_id = '37' ORDER BY created_at DESC LIMIT 5\""
```

### Try-On API Route

`/api/codex/tryon` proxies to `https://codeximageapi.pixilens.online/v1/generate` (NOT the Azure host). The `CODEX_TRYON_API_URL` env var is optional — it defaults to that URL. The `CODEX_API_KEY` env var is required.
