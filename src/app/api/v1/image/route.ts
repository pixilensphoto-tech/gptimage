import { NextRequest, NextResponse } from "next/server";
import { createJsonImageJob, validateJsonApiKey } from "@/lib/jsonImageJobs";

export const runtime = "nodejs";

type JsonImageRequest = {
  apiKey?: string;
  prompt?: string;
  sourceImage?: string;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as JsonImageRequest | null;
  if (!payload) return jsonError("Request body must be JSON");

  const auth = validateJsonApiKey(payload.apiKey);
  if ("error" in auth) return jsonError(auth.error ?? "Unauthorized", auth.status);

  const result = createJsonImageJob(payload.prompt ?? "", payload.sourceImage);
  if ("error" in result) return jsonError(result.error ?? "Image generation failed", result.status);

  return NextResponse.json(
    {
      jobId: result.job.id,
      status: result.job.status,
      progress: result.job.progress,
      message: result.job.message,
      statusUrl: `/api/v1/image/${result.job.id}`,
    },
    { status: 202 }
  );
}
