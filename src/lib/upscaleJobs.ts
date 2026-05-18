import { createGalleryItem, updateGalleryItem } from "@/lib/galleryDb";

const UPSCALE_STATUS_POLL_MS = 8_000;
const UPSCALE_STATUS_TIMEOUT_MS = 8 * 60 * 1000;

type ImgBbResult = {
  url: string;
  viewerUrl?: string;
  displayUrl: string;
  deleteUrl: string;
};

type RunningHubResult = {
  taskId: string;
  outputUrl: string;
  workflowId: string;
};

type UpscaleResult = {
  ok: boolean;
  imgbb: ImgBbResult;
  runninghub: RunningHubResult;
};

type AsyncUpscaleResponse = {
  ok: boolean;
  async: true;
  statusUrl: string;
  job: {
    id: string;
    status: "pending" | "processing" | "succeeded" | "failed";
    progress: number;
    message: string;
    outputUrl?: string;
    error?: string | null;
  };
};

function getEnv(key: string): string | undefined {
  const val = process.env[key];
  if (!val) return undefined;
  try {
    const decoded = Buffer.from(val, "base64").toString("utf-8");
    if (decoded.includes(":") || decoded.includes("/") || decoded.includes("https")) {
      return decoded;
    }
  } catch {}
  return val;
}

async function applyUpscaleStatus(
  id: string,
  job: AsyncUpscaleResponse["job"],
  metadata?: any
) {
  const isFinished = job.status === "succeeded" || job.status === "failed";

  await updateGalleryItem(id, {
    status: job.status,
    progress: job.progress,
    message: job.message,
    imageUrl: job.outputUrl || undefined,
    error: job.error || undefined,
    metadata: metadata
      ? { ...(metadata || {}), upstream: { job } }
      : { upstream: { job } },
  });

  return isFinished;
}

async function pollUpscaleStatus(
  id: string,
  apiUrl: string,
  apiKey: string,
  statusUrl: string,
  initialJob: AsyncUpscaleResponse["job"]
) {
  const startTime = Date.now();
  let latestJob = initialJob;
  const resolvedStatusUrl = statusUrl.startsWith("http")
    ? statusUrl
    : `${apiUrl}${statusUrl}`;

  while (Date.now() - startTime < UPSCALE_STATUS_TIMEOUT_MS) {
    const isFinished = await applyUpscaleStatus(id, latestJob);
    if (isFinished) return;

    await new Promise((r) => setTimeout(r, UPSCALE_STATUS_POLL_MS));

    const response = await fetch(resolvedStatusUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Upscale status check failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as AsyncUpscaleResponse;
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
}

export async function runUpscaleJob(id: string, sourceImageUrl: string) {
  const apiUrl = (getEnv("CODEX_TRYON_API_URL") ?? "https://codeximageapi.pixilens.online").replace(/\/$/, "");
  const apiKey = getEnv("CODEX_API_KEY");

  console.log(`[upscale job ${id}] starting with apiUrl: ${apiUrl}`);

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
