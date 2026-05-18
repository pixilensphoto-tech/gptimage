import { NextRequest, NextResponse } from "next/server";
import { createCodexJob } from "@/lib/codexJobs";
import { createGalleryItem } from "@/lib/galleryDb";

const defaultAspectRatio = "9:16";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return jsonError("Invalid request body", 400);
  }

  const aspectRatio = typeof payload.aspectRatio === "string" && payload.aspectRatio.trim() ? payload.aspectRatio.trim() : defaultAspectRatio;
  const normalizedPayload = { ...payload, aspectRatio };

  const image = await createGalleryItem({
    generator: payload.bypassCodex ? "codex_then_tryon" : "codex",
    status: "pending",
    progress: 8,
    message: "Queued generation",
    prompt: typeof payload.prompt === "string" ? payload.prompt : undefined,
    aspectRatio,
    metadata: { request: normalizedPayload },
  });

  const result = createCodexJob(image.id, normalizedPayload as Record<string, unknown>);

  return NextResponse.json(
    {
      id: image.id,
      jobId: result.job.id,
      status: image.status,
      progress: image.progress,
      message: "Generation started. Check the Images gallery for progress.",
      galleryUrl: "/images",
      statusUrl: `/api/codex/generate/${result.job.id}`,
    },
    { status: 202 }
  );
}
