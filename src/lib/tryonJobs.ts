import { createGalleryItem, updateGalleryItem } from "@/lib/galleryDb";

type TryOnPayload = Record<string, unknown>;

type TryOnResult = {
  pipeline: "runninghub";
  runninghub?: { taskId: string; outputUrl: string; workflowId: string };
  imgbb?: { url: string };
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
    let data: TryOnResult | { error?: string } | null = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error((data && "error" in data && data.error) || text || "Try-on generation failed");
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
