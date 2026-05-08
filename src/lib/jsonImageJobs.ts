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
  errorCode?: "moderation_blocked";
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

export function createJsonImageJob(prompt: string, sourceImage?: string) {
  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length < 3) return { error: "prompt is required", status: 400 } as const;
  if (trimmedPrompt.length > 4000) return { error: "prompt must be 4000 characters or fewer", status: 400 } as const;

  const parsedImage = sourceImage?.trim() ? parseSourceImage(sourceImage.trim()) : null;
  if (sourceImage?.trim() && !parsedImage) return { error: "sourceImage must be a valid base64 image or data URL", status: 400 } as const;
  if (parsedImage && parsedImage.bytes.length > maxSourceImageBytes) return { error: "sourceImage must be 8MB or smaller after base64 decoding", status: 400 } as const;

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

async function runJsonImageJob(id: string, prompt: string, sourceImage: SourceImage | null) {
  try {
    setJob(id, { status: "running", progress: 24, message: sourceImage ? "Sending source image to GPT Image" : "Sending prompt to GPT Image" });
    const heartbeat = startProgressHeartbeat(id);
    const safePrompt = buildSafeFashionApiPrompt(prompt);
    const result = sourceImage ? await callAzureImageEdit(safePrompt, sourceImage) : await callAzureImageGeneration(safePrompt);
    clearInterval(heartbeat);
    if ("error" in result) throw new ImageGenerationError(result.error ?? "Image generation failed", isModerationError(result.error) ? "moderation_blocked" : undefined);

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
    const isModerationBlocked = error instanceof ImageGenerationError && error.code === "moderation_blocked";
    setJob(id, {
      status: "failed",
      progress: 100,
      message: "Generation failed",
      error: isModerationBlocked ? moderationGuidance : error instanceof Error ? error.message : "Image generation failed",
      errorCode: isModerationBlocked ? "moderation_blocked" : undefined,
    });
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

function buildSafeFashionApiPrompt(prompt: string) {
  return [
    sanitizeFashionPrompt(prompt),
    "Professional adult fashion/editorial or commercial campaign image. Non-explicit styling, no nudity, no sexualized framing, no intimate anatomy emphasis, no voyeuristic angle, no fetish styling, and no minors. Keep pose, wardrobe, lighting, and camera language suitable for a mainstream brand campaign.",
  ].join("\n\n");
}

function sanitizeFashionPrompt(prompt: string) {
  return prompt
    .replace(/\bsexy\b/gi, "elegant")
    .replace(/\bsensual\b/gi, "refined")
    .replace(/\bseductive\b/gi, "confident")
    .replace(/\berotic\b/gi, "editorial")
    .replace(/\blingerie\b/gi, "fashion outfit")
    .replace(/\bunderwear\b/gi, "fashion outfit")
    .replace(/\bnude\b/gi, "neutral-toned")
    .replace(/\bnaked\b/gi, "minimally styled")
    .replace(/\bbody\b/gi, "silhouette")
    .replace(/\banatomy\b/gi, "silhouette")
    .replace(/\bcurves?\b/gi, "garment shape")
    .replace(/\bskin\b/gi, "complexion")
    .replace(/\bprovocative\b/gi, "high-fashion")
    .replace(/\bracy\b/gi, "bold editorial");
}

class ImageGenerationError extends Error {
  constructor(message: string, readonly code?: "moderation_blocked") {
    super(message);
  }
}

const moderationGuidance = "Azure blocked this request with its image safety filter. Try professional adult fashion/editorial wording and avoid nudity, lingerie, swimwear, sheer/wet clothing, sexualized poses, minors, or body-anatomy wording.";

function isModerationError(message: string | undefined) {
  return /moderation|content.?filter|safety|responsible ai|policy|rai/i.test(message ?? "");
}

async function callAzureImageGeneration(prompt: string) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-image-2";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview";

  if (!endpoint || !apiKey) return { error: "Azure image generation is not configured", status: 500 } as const;

  const response = await fetch(`${endpoint}/openai/deployments/${deployment}/images/generations?api-version=${apiVersion}`, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, n: 1, size: "1024x1536", quality: "medium", output_format: "png" }),
  });

  const data = (await response.json()) as AzureImageResponse;
  if (!response.ok) return { error: data.error?.message ?? "Azure image generation failed", status: response.status } as const;
  return { data } as const;
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
  body.set("quality", "medium");
  body.set("input_fidelity", "low");
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
