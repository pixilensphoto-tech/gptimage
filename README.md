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

## Coolify

Use the included `Dockerfile`. Expose port `3000` and set the environment variables in Coolify for `gptimage.pixilens.app`.
