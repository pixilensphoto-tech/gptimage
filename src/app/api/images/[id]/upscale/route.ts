import { NextResponse } from "next/server";
import { getGalleryItem } from "@/lib/galleryDb";
import { createUpscaleJob } from "@/lib/upscaleJobs";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await getGalleryItem(id);

  if (!item) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  if (!item.imageUrl) {
    return NextResponse.json({ error: "This image does not have a source file to upscale yet" }, { status: 400 });
  }

  const job = await createUpscaleJob({
    sourceItemId: item.id,
    sourceImageUrl: item.imageUrl,
    prompt: item.prompt,
    aspectRatio: item.aspectRatio,
  });

  return NextResponse.json(
    {
      ok: true,
      id: job.id,
      status: job.status,
      progress: job.progress,
      message: "AI upscale queued. Check the Images gallery for progress.",
    },
    { status: 202 }
  );
}
