type AzureImageResponse = {
  data?: Array<{ b64_json?: string; b64?: string; url?: string }>;
  error?: { message?: string };
};

type SourceImage = {
  bytes: Buffer;
  mimeType: string;
};

export type JsonImageJob = {
  id: string;
  prompt: string;
  status: "queued" | "running" | "succeeded" | "failed";
  progress: number;
  message: string;
  createdAt: number;
  updatedAt: number;
  result?: { image: string; mimeType: string; prompt: string };
  error?: string;
};

const jobs = new Map<string, JsonImageJob>();
const maxSourceImageBytes = 8 * 1024 * 1024;

export function validateJsonApiKey(apiKey: string | undefined) {
  const expectedApiKey = process.env.GPTIMAGE_API_KEY;
  if (!expectedApiKey) return { error: "JSON image API is not configured", status: 500 } as const;
  if (apiKey !== expectedApiKey) return { error: "Invalid API key", status: 401 } as const;
  return { ok: true } as const;
}

export function getJsonImageJob(id: string) {
  pruneJobs();
  return jobs.get(id);
}

export function createJsonImageJob(prompt: string, sourceImage: string) {
  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length < 3) return { error: "prompt is required", status: 400 } as const;
  if (trimmedPrompt.length > 4000) return { error: "prompt must be 4000 characters or fewer", status: 400 } as const;

  const parsedImage = parseSourceImage(sourceImage.trim());
  if (!parsedImage) return { error: "sourceImage must be a valid base64 image or data URL", status: 400 } as const;
  if (parsedImage.bytes.length > maxSourceImageBytes) return { error: "sourceImage must be 8MB or smaller after base64 decoding", status: 400 } as const;

  const id = crypto.randomUUID();
  const now = Date.now();
  jobs.set(id, {
    id,
    prompt: trimmedPrompt,
    status: "queued",
    progress: 8,
    message: "Queued generation",
    createdAt: now,
    updatedAt: now,
  });

  void runJsonImageJob(id, trimmedPrompt, parsedImage);
  return { job: jobs.get(id)! } as const;
}

function parseSourceImage(sourceImage: string) {
  const dataUrlMatch = sourceImage.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i);
  const mimeType = dataUrlMatch?.[1] ?? "image/png";
  const base64 = dataUrlMatch?.[2] ?? sourceImage;

  try {
    const bytes = Buffer.from(base64, "base64");
    if (bytes.length === 0) return null;
    return { bytes, mimeType };
  } catch {
    return null;
  }
}

function setJob(id: string, updates: Partial<JsonImageJob>) {
  const current = jobs.get(id);
  if (!current) return;
  jobs.set(id, { ...current, ...updates, updatedAt: Date.now() });
}

async function runJsonImageJob(id: string, prompt: string, sourceImage: SourceImage) {
  try {
    setJob(id, { status: "running", progress: 24, message: "Sending source image to GPT Image" });
    const heartbeat = startProgressHeartbeat(id);
    const result = await callAzureImageEdit(prompt, sourceImage);
    clearInterval(heartbeat);
    if ("error" in result) throw new Error(result.error ?? "Image generation failed");

    setJob(id, { progress: 88, message: "Receiving generated image" });
    const first = result.data.data?.[0];
    const image = first?.b64_json ?? first?.b64;
    if (image) {
      setJob(id, { status: "succeeded", progress: 100, message: "Image ready", result: { image, mimeType: "image/png", prompt } });
      return;
    }

    if (first?.url) {
      const imageResponse = await fetch(first.url);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      setJob(id, {
        status: "succeeded",
        progress: 100,
        message: "Image ready",
        result: { image: buffer.toString("base64"), mimeType: imageResponse.headers.get("content-type") ?? "image/png", prompt },
      });
      return;
    }

    throw new Error("Azure did not return an image");
  } catch (error) {
    setJob(id, { status: "failed", progress: 100, message: "Generation failed", error: error instanceof Error ? error.message : "Image generation failed" });
  }
}

function startProgressHeartbeat(id: string) {
  return setInterval(() => {
    const job = jobs.get(id);
    if (!job || job.status !== "running" || job.progress >= 84) return;
    setJob(id, {
      progress: job.progress + 1,
      message: job.progress > 68 ? "Still rendering details" : job.message,
    });
  }, 2500);
}

async function callAzureImageEdit(prompt: string, sourceImage: SourceImage) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-image-2";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview";

  if (!endpoint || !apiKey) return { error: "Azure image generation is not configured", status: 500 } as const;

  const body = new FormData();
  body.set("prompt", prompt);
  body.set("n", "1");
  body.set("size", "1024x1536");
  body.set("output_format", "png");
  body.append("image[]", new Blob([new Uint8Array(sourceImage.bytes)], { type: sourceImage.mimeType }), "source-image");

  const response = await fetch(`${endpoint}/openai/deployments/${deployment}/images/edits?api-version=${apiVersion}`, {
    method: "POST",
    headers: { "api-key": apiKey },
    body,
  });

  const data = (await response.json()) as AzureImageResponse;
  if (!response.ok) return { error: data.error?.message ?? "Azure image generation failed", status: response.status } as const;
  return { data } as const;
}

function pruneJobs() {
  const cutoff = Date.now() - 30 * 60_000;
  for (const [id, job] of jobs) {
    if (job.updatedAt < cutoff) jobs.delete(id);
  }
}
