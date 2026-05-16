import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, createImageJob } from "@/lib/gpt2ImageJobs";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  if (!checkRateLimit()) {
    return jsonError("Too many generation requests. Please wait a minute and try again.", 429);
  }

  const result = await createImageJob(await request.formData());
  if ("error" in result) {
    return jsonError(result.error ?? "Image generation failed", result.status);
  }

  return NextResponse.json({ jobId: result.job.id, status: result.job.status, progress: result.job.progress, message: result.job.message }, { status: 202 });
}