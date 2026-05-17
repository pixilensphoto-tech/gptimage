import { NextRequest, NextResponse } from "next/server";
import { createTryOnJob } from "@/lib/tryonJobs";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return jsonError("Invalid request body", 400);
  }

  const image = await createTryOnJob(payload as Record<string, unknown>);

  return NextResponse.json(
    {
      id: image.id,
      status: image.status,
      progress: image.progress,
      message: "Try-on started. Check the Images gallery for progress.",
      galleryUrl: "/images",
    },
    { status: 202 }
  );
}
