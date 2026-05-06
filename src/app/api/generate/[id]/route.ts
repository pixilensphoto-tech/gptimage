import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/imageJobs";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = getJob(id);

  if (!job) {
    return NextResponse.json({ error: "Generation job not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    message: job.message,
    error: job.error,
    result: job.result,
  });
}
