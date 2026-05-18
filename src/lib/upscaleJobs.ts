import { createGalleryItem, updateGalleryItem } from "@/lib/galleryDb";

const UPSCALE_STATUS_POLL_MS = 8_000;
const UPSCALE_STATUS_TIMEOUT_MS = 8 * 60 * 1000;

type ImgBbResult = {
  url: string;
  viewerUrl?: string;
  displayUrl?: string;
  deleteUrl?: string;
};

type RunningHubResult = {
  taskId: string;
  outputUrl?: string;
  workflowId: string;
};

type AsyncUpscaleJob = {
  id: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  progress: number;
  message: string;
  createdAt?: string;
  updatedAt?: string;
  runninghub?: RunningHubResult | null;
  imgbb?: ImgBbResult | null;
  error?: string | null;
};

type AsyncUpscaleResponse = {
  ok?: boolean;
  pipeline?: "runninghub";
  async?: boolean;
  statusUrl?: string;
  job?: AsyncUpscaleJob;
  error?: string;
};

type UpscaleResult = {
  pipeline: "runninghub";
  runninghub?: RunningHubResult;
  imgbb?: ImgBbResult;
};

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

function resolveStatusUrl(apiUrl: string, statusUrl: string) {
  if (statusUrl.startsWith("http://") || statusUrl.startsWith("https://")) {
    return statusUrl;
  }

  if (statusUrl.startsWith("/")) {
    return `${apiUrl}${statusUrl}`;
  }

  return `${apiUrl}/${statusUrl}`;
}

async function applyUpscaleStatus(id: string, job: AsyncUpscaleJob, metadata: Record<string, unknown>) {
  await updateGalleryItem(id, {
    status: job.status,
    progress: job.progress,
    message: job.message,
    imageUrl: job.imgbb?.url ?? job.runninghub?.outputUrl,
    error: job.error ?? undefined,
    metadata,
  });
}

async function pollUpscaleStatus(id: string, apiUrl: string, apiKey: string, statusUrl: string, initialJob?: AsyncUpscaleJob) {
  const startedAt = Date.now();
  const resolvedStatusUrl = resolveStatusUrl(apiUrl, statusUrl);
  let latestJob = initialJob;

  if (latestJob) {
    await applyUpscaleStatus(id, latestJob, {
      upstream: {
        async: true,
        statusUrl: resolvedStatusUrl,
        job: latestJob,
      },
    });
  }

  while (Date.now() - startedAt < UPSCALE_STATUS_TIMEOUT_MS) {
    if (latestJob?.status === "succeeded" || latestJob?.status === "failed") {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, UPSCALE_STATUS_POLL_MS));

    const response = await fetch(resolvedStatusUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    const text = await response.text();
    let data: AsyncUpscaleResponse | null = null;

    try {
      data = text ? (JSON.parse(text) as AsyncUpscaleResponse) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error((data && data.error) || text || "Upscale status request failed");
    }

    if (!data?.job) {
      throw new Error("Upscale status response was missing job details");
    }

    latestJob = data.job;
    await applyUpscaleStatus(id, latestJob, {
      upstream: {
        async: true,
        statusUrl: resolvedStatusUrl,
        job: latestJob,
      },
    });
  }

  throw new Error("Upscale status polling timed out");
export async function runUpscaleJob(id: string, sourceImageUrl: string) {
  const apiUrl = (getEnv("CODEX_TRYON_API_URL") ?? "https://codeximageapi.pixilens.online").replace(/\/$/, "");
  console.log(`[upscale job ${id}] starting with apiUrl: ${apiUrl}`);

  try {
  const apiKey = getEnv("CODEX_API_KEY");

  if (!apiUrl) {
    await updateGalleryItem(id, {
      status: "failed",
      progress: 100,
      message: "Upscale failed",
      error: "CODEX_TRYON_API_URL is not configured",
    });
    return;
  }

  if (!apiKey) {
    await updateGalleryItem(id, {
      status: "failed",
      progress: 100,
      message: "Upscale failed",
      error: "CODEX_API_KEY is not configured",
    });
    return;
  }

  await updateGalleryItem(id, {
    status: "processing",
    progress: 20,
    message: "Sending request to upscale pipeline",
  });

  try {
    const response = await fetch(`${apiUrl}/v1/upscale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ image: { url: sourceImageUrl } }),
      cache: "no-store",
    });

    const text = await response.text();
    let data: AsyncUpscaleResponse | UpscaleResult | { error?: string } | null = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error((data && "error" in data && data.error) || text || "Upscale generation failed");
    }

    const asyncResult = data as AsyncUpscaleResponse | null;
    if (response.status === 202 || asyncResult?.async || asyncResult?.statusUrl || asyncResult?.job) {
      const statusUrl = asyncResult?.statusUrl;
      if (!statusUrl) {
        throw new Error("Upscale service returned async response without status URL");
      }

      await pollUpscaleStatus(id, apiUrl, apiKey, statusUrl, asyncResult.job);
      return;
    }

    const result = (data ?? {}) as UpscaleResult;
    await updateGalleryItem(id, {
      status: "succeeded",
      progress: 100,
      message: "Upscaled image ready",
      imageUrl: result.imgbb?.url ?? result.runninghub?.outputUrl,
      metadata: { result },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI upscale failed";
    console.error(`[upscale job ${id}]`, message);
    await updateGalleryItem(id, {
      status: "failed",
      progress: 100,
      message: "Upscale failed",
      error: message,
    });
  }
}

export async function createUpscaleJob(input: {
  sourceImageUrl: string;
  sourceItemId: string;
  prompt?: string;
  aspectRatio?: string;
}) {
  const image = await createGalleryItem({
    generator: "upscale",
    status: "pending",
    progress: 8,
    message: "Queued AI upscale",
    prompt: input.prompt,
    aspectRatio: input.aspectRatio,
    metadata: {
      source: {
        id: input.sourceItemId,
        imageUrl: input.sourceImageUrl,
      },
    },
  });

  void runUpscaleJob(image.id, input.sourceImageUrl);
  return image;
}
