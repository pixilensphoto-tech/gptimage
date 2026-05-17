type CodexJobStatus = "queued" | "running" | "succeeded" | "failed";

const CODEX_FETCH_TIMEOUT_MS = 5 * 60_000;

import { updateGalleryItem } from "@/lib/galleryDb";

type CodexPayload = Record<string, unknown>;

type TryOnResult = {
  pipeline: "runninghub";
  runninghub?: { taskId: string; outputUrl: string; workflowId: string };
  imgbb?: { url: string; viewerUrl?: string; displayUrl?: string; deleteUrl?: string };
};

export type CodexJobResult = {
  pipeline: "codex" | "runninghub";
  dimensions?: { width: number; height: number };
  codex?: { notes: string };
  runninghub?: { taskId: string; outputUrl: string; workflowId: string };
  imgbb?: { url: string; viewerUrl?: string; displayUrl?: string; deleteUrl?: string };
  usedFallback?: boolean;
  chainedTryOn?: TryOnResult;
};

export type CodexJob = {
  id: string;
  status: CodexJobStatus;
  progress: number;
  message: string;
  createdAt: number;
  updatedAt: number;
  result?: CodexJobResult;
  error?: string;
};

const jobs = new Map<string, CodexJob>();

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

export function getCodexJob(id: string) {
  pruneJobs();
  return jobs.get(id);
}

export function createCodexJob(id: string, payload: CodexPayload) {
  const now = Date.now();
  jobs.set(id, {
    id,
    status: "queued",
    progress: 8,
    message: "Queued generation",
    createdAt: now,
    updatedAt: now,
  });

  void runCodexJob(id, payload);
  return { job: jobs.get(id)! } as const;
}

function setJob(id: string, updates: Partial<CodexJob>) {
  const current = jobs.get(id);
  if (!current) return;
  jobs.set(id, { ...current, ...updates, updatedAt: Date.now() });
  void syncGalleryItem(id, updates);
}

async function syncGalleryItem(id: string, updates: Partial<CodexJob>) {
  const metadata: Record<string, unknown> = {};
  if (updates.result) metadata.result = updates.result;

  const imageUrl = updates.result?.chainedTryOn?.imgbb?.url ?? updates.result?.chainedTryOn?.runninghub?.outputUrl ?? updates.result?.imgbb?.url;

  await updateGalleryItem(id, {
    status:
      updates.status === "queued"
        ? "pending"
        : updates.status === "running"
          ? "processing"
          : updates.status,
    progress: updates.progress,
    message: updates.message,
    error: updates.error,
    imageUrl,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  }).catch((error) => {
    console.error(`[gallery sync ${id}]`, error);
  });
}

async function runCodexJob(id: string, payload: CodexPayload) {
  const heartbeat = startProgressHeartbeat(id);

  try {
    const codexResult = await runCodexGeneration(id, payload);

    if (!payload.bypassCodex) {
      setJob(id, {
        status: "succeeded",
        progress: 100,
        message: "Image ready",
        result: codexResult,
      });
      return;
    }

    setJob(id, {
      status: "running",
      progress: 82,
      message: "Running try-on after Codex generation",
      result: codexResult,
    });

    const tryOnResult = await runChainedTryOn(payload, codexResult);

    setJob(id, {
      status: "succeeded",
      progress: 100,
      message: "Try-on image ready",
      result: {
        ...codexResult,
        pipeline: tryOnResult.pipeline,
        runninghub: tryOnResult.runninghub,
        imgbb: tryOnResult.imgbb,
        chainedTryOn: tryOnResult,
      },
    });
  } catch (error) {
    const details = describeCodexError(error);
    console.error(`[codex job ${id}]`, details);
    setJob(id, {
      status: "failed",
      progress: 100,
      message: payload.bypassCodex ? "Codex or try-on failed" : "Generation failed",
      error: details,
    });
  } finally {
    clearInterval(heartbeat);
  }
}

async function runCodexGeneration(id: string, payload: CodexPayload) {
  const apiUrl = getEnv("CODEX_API_URL")?.replace(/\/$/, "");
  const apiKey = getEnv("CODEX_API_KEY");

  if (!apiUrl) {
    throw new Error("CODEX_API_URL is not configured");
  }
  if (!apiKey) {
    throw new Error("CODEX_API_KEY is not configured");
  }

  setJob(id, {
    status: "running",
    progress: 20,
    message: "Sending request to Codex API",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CODEX_FETCH_TIMEOUT_MS);

  const response = await fetch(`${apiUrl}/v1/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ ...payload, bypassCodex: false }),
    cache: "no-store",
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  const text = await response.text();

  let data: CodexJobResult | { error?: string } | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error((data && "error" in data && data.error) || text || "Codex generation failed");
  }

  return (data ?? {}) as CodexJobResult;
}

async function runChainedTryOn(payload: CodexPayload, codexResult: CodexJobResult) {
  const apiUrl = (getEnv("CODEX_TRYON_API_URL") ?? getEnv("CODEX_API_URL") ?? "https://codeximageapi.pixilens.online").replace(/\/$/, "");
  const apiKey = getEnv("CODEX_API_KEY");

  if (!apiUrl) {
    throw new Error("CODEX_TRYON_API_URL is not configured");
  }
  if (!apiKey) {
    throw new Error("CODEX_API_KEY is not configured");
  }

  const codexImageUrl = codexResult.imgbb?.url ?? codexResult.runninghub?.outputUrl;
  if (!codexImageUrl) {
    throw new Error("Codex finished without an output image for try-on");
  }

  const body = {
    identityImages: [{ dataUrl: codexImageUrl }],
    outfitImage: payload.outfitImage,
    bypassCodex: true,
    aspectRatio: typeof payload.aspectRatio === "string" ? payload.aspectRatio : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
    category: typeof payload.category === "string" ? payload.category : undefined,
  };

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
  let data: TryOnResult | { error?: string } | null = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error((data && "error" in data && data.error) || text || "Try-on generation failed");
  }

  return (data ?? {}) as TryOnResult;
}

function describeCodexError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return `Codex generation timed out after ${Math.round(CODEX_FETCH_TIMEOUT_MS / 1000)} seconds`;
  }

  if (!(error instanceof Error)) {
    return "Codex generation failed";
  }

  const parts = [error.message];
  const cause = error.cause;

  if (cause instanceof Error) {
    parts.push(cause.message);
    const nestedCause = (cause as Error & { cause?: unknown }).cause;
    if (nestedCause instanceof Error) {
      parts.push(nestedCause.message);
    }
  }

  return parts.filter(Boolean).join(": ");
}

function startProgressHeartbeat(id: string) {
  return setInterval(() => {
    const job = jobs.get(id);
    if (!job || job.status !== "running" || job.progress >= 90) return;
    setJob(id, {
      progress: Math.min(job.progress + 2, 90),
      message: job.progress >= 72 ? "Still generating image" : job.message,
    });
  }, 2500);
}

function pruneJobs() {
  const cutoff = Date.now() - 30 * 60_000;
  for (const [id, job] of jobs) {
    if (job.updatedAt < cutoff) jobs.delete(id);
  }
}
