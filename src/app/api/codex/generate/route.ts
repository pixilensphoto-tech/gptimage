import { NextRequest, NextResponse } from "next/server";
import { createCodexJob } from "@/lib/codexJobs";
import { createGalleryItem } from "@/lib/galleryDb";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return jsonError("Invalid request body", 400);
  }

  const image = await createGalleryItem({
    generator: payload.bypassCodex ? "codex_then_tryon" : "codex",
    status: "pending",
    progress: 8,
    message: "Queued generation",
    prompt: typeof payload.prompt === "string" ? payload.prompt : undefined,
    aspectRatio: typeof payload.aspectRatio === "string" ? payload.aspectRatio : undefined,
    metadata: { request: payload },
  });

  const result = createCodexJob(image.id, payload as Record<string, unknown>);

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
