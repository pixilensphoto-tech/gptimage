import { createGalleryItem, updateGalleryItem } from "@/lib/galleryDb";

type TryOnPayload = Record<string, unknown>;

type TryOnResult = {
  pipeline: "runninghub";
  runninghub?: { taskId: string; outputUrl: string; workflowId: string };
  imgbb?: { url: string };
};

type AsyncTryOnJob = {
  id: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  progress: number;
  message: string;
  createdAt?: string;
  updatedAt?: string;
  name?: string | null;
  aspectRatio?: string | null;
  runninghub?: { taskId: string; outputUrl?: string; workflowId: string } | null;
  imgbb?: { url: string } | null;
  error?: string | null;
};

type AsyncTryOnResponse = {
  ok?: boolean;
  pipeline?: "runninghub";
  async?: boolean;
  statusUrl?: string;
  job?: AsyncTryOnJob;
  error?: string;
};

const TRYON_STATUS_POLL_MS = 8_000;
const TRYON_STATUS_TIMEOUT_MS = 8 * 60 * 1000;

function getEnv(key: string): string | undefined {
  const val = process.env[key];
  if (!val) return undefined;
  try {
    const decoded = Buffer.from(val, "base64").toString("utf-8");
    const ratio = decoded.length / val.length;
    const validLength = ratio > 0.5 && ratio < 1.0;
    const validUtf8 = !decoded.includes("�");
    if (validUtf8 && validLength && decoded !== val) return decoded;
  } catch {}
  return val;
}

export async function createTryOnJob(payload: TryOnPayload) {
  const image = await createGalleryItem({
    generator: "tryon",
    status: "pending",
    progress: 8,
    message: "Queued try-on generation",
    aspectRatio: typeof payload.aspectRatio === "string" ? payload.aspectRatio : undefined,
    metadata: { request: payload },
  });

  void runTryOnJob(image.id, payload);
  return image;
}

function resolveStatusUrl(apiUrl: string, statusUrl: string) {
  if (statusUrl.startsWith("http://") || statusUrl.startsWith("https://")) {
    return statusUrl;
  }

  if (statusUrl.startsWith("/")) {
    return `${apiUrl}${statusUrl}`;
  }

  return `${apiUrl}/${statusUrl}`;
}

async function applyTryOnStatus(id: string, job: AsyncTryOnJob, metadata: Record<string, unknown>) {
  await updateGalleryItem(id, {
    status: job.status,
    progress: job.progress,
    message: job.message,
    imageUrl: job.imgbb?.url ?? job.runninghub?.outputUrl,
    error: job.error ?? undefined,
    metadata,
  });
}

async function pollTryOnStatus(id: string, apiUrl: string, apiKey: string, statusUrl: string, initialJob?: AsyncTryOnJob) {
  const startedAt = Date.now();
  const resolvedStatusUrl = resolveStatusUrl(apiUrl, statusUrl);
  let latestJob = initialJob;

  if (latestJob) {
    await applyTryOnStatus(id, latestJob, {
      upstream: {
        async: true,
        statusUrl: resolvedStatusUrl,
        job: latestJob,
      },
    });
  }

  while (Date.now() - startedAt < TRYON_STATUS_TIMEOUT_MS) {
    if (latestJob?.status === "succeeded" || latestJob?.status === "failed") {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, TRYON_STATUS_POLL_MS));

    const response = await fetch(resolvedStatusUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    const text = await response.text();
    let data: AsyncTryOnResponse | null = null;

    try {
      data = text ? (JSON.parse(text) as AsyncTryOnResponse) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error((data && data.error) || text || "Try-on status request failed");
    }

    if (!data?.job) {
      throw new Error("Try-on status response was missing job details");
    }

    latestJob = data.job;
    await applyTryOnStatus(id, latestJob, {
      upstream: {
        async: true,
        statusUrl: resolvedStatusUrl,
        job: latestJob,
      },
    });
  }

  throw new Error("Try-on status polling timed out");
}

async function runTryOnJob(id: string, payload: TryOnPayload) {
  const apiUrl = (getEnv("CODEX_TRYON_API_URL") ?? "https://codeximageapi.pixilens.online").replace(/\/$/, "");
  const apiKey = getEnv("CODEX_API_KEY");

  if (!apiUrl) {
    await updateGalleryItem(id, {
      status: "failed",
      progress: 100,
      message: "Try-on failed",
      error: "CODEX_TRYON_API_URL is not configured",
    });
    return;
  }

  if (!apiKey) {
    await updateGalleryItem(id, {
      status: "failed",
      progress: 100,
      message: "Try-on failed",
      error: "CODEX_API_KEY is not configured",
    });
    return;
  }

  const modelImage = payload.modelImage ?? payload.identityImage;
  const outfitImage = payload.outfitImage;
  const body = {
    identityImages: modelImage ? [modelImage] : [],
    outfitImage,
    bypassCodex: true,
    aspectRatio: typeof payload.aspectRatio === "string" ? payload.aspectRatio : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
    category: typeof payload.category === "string" ? payload.category : undefined,
  };

  await updateGalleryItem(id, {
    status: "processing",
    progress: 20,
    message: "Sending request to try-on pipeline",
  });

  try {
    const response = await fetch(`${apiUrl}/v1/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await response.text();
    let data: AsyncTryOnResponse | TryOnResult | { error?: string } | null = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error((data && "error" in data && data.error) || text || "Try-on generation failed");
    }

    const asyncResult = data as AsyncTryOnResponse | null;
    if (response.status === 202 || asyncResult?.async || asyncResult?.statusUrl || asyncResult?.job) {
      const statusUrl = asyncResult?.statusUrl;
      if (!statusUrl) {
        throw new Error("Try-on service returned async response without status URL");
      }

      await pollTryOnStatus(id, apiUrl, apiKey, statusUrl, asyncResult.job);
      return;
    }

    const result = (data ?? {}) as TryOnResult;
    await updateGalleryItem(id, {
      status: "succeeded",
      progress: 100,
      message: "Try-on image ready",
      imageUrl: result.imgbb?.url ?? result.runninghub?.outputUrl,
      metadata: { result },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Try-on generation failed";
    console.error(`[tryon job ${id}]`, message);
    await updateGalleryItem(id, {
      status: "failed",
      progress: 100,
      message: "Try-on failed",
      error: message,
    });
  }
}
