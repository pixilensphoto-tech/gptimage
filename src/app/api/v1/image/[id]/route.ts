import { NextRequest, NextResponse } from "next/server";
import { getJsonImageJob, validateJsonApiKey } from "@/lib/jsonImageJobs";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const apiKey = request.nextUrl.searchParams.get("apiKey") ?? request.headers.get("x-api-key") ?? undefined;
  const auth = validateJsonApiKey(apiKey);
  if ("error" in auth) return NextResponse.json({ error: auth.error ?? "Unauthorized" }, { status: auth.status });

  const { id } = await context.params;
  const job = getJsonImageJob(id);
  if (!job) return NextResponse.json({ error: "Generation job not found" }, { status: 404 });

  return NextResponse.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    message: job.message,
    error: job.error,
    result: job.result,
  });
}
