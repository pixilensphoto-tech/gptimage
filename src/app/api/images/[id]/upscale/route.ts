import { NextResponse } from "next/server";
import { getGalleryItem, createGalleryItem, updateGalleryItem } from "@/lib/galleryDb";
import { uploadToRunningHub, createDirectUpscaleTask } from "@/lib/directRunningHub";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  console.log(`[upscale API] Looking up item: ${id}`);

  let item;
  let dbErrorMessage: string | null = null;
  try {
    item = await getGalleryItem(id);
    console.log(`[upscale API] Found item:`, item ? { id: item.id, status: item.status, hasImageUrl: !!item.imageUrl } : null);
  } catch (dbError) {
    dbErrorMessage = dbError instanceof Error ? dbError.message : "Unknown database error";
    console.error(`[upscale API] DB error:`, dbError);
  }

  if (!item) {
    console.log(`[upscale API] Item not found: ${id}`);
    return NextResponse.json(
      { error: "Image not found", id, dbError: dbErrorMessage },
      { status: 404 }
    );
  }

  if (!item.imageUrl) {
    return NextResponse.json({ error: "This image does not have a source file to upscale yet" }, { status: 400 });
  }

  // Create gallery placeholder for upscale result
  const upscaleItem = await createGalleryItem({
    generator: "upscale",
    status: "pending",
    progress: 5,
    message: "Starting AI upscale",
    prompt: item.prompt,
    aspectRatio: item.aspectRatio,
    metadata: {
      source: {
        id: item.id,
        imageUrl: item.imageUrl,
      },
    },
  });

  // Start async upscale process
  void (async () => {
    try {
      // Download source image
      await updateGalleryItem(upscaleItem.id, {
        status: "processing",
        progress: 10,
        message: "Downloading source image",
      });

      const imageResponse = await fetch(item.imageUrl!);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download source image: ${imageResponse.status}`);
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // Upload to RunningHub
      await updateGalleryItem(upscaleItem.id, {
        progress: 25,
        message: "Uploading to AI service",
      });

      const rhFileName = await uploadToRunningHub(imageBuffer, `upscale-${upscaleItem.id}.png`);

      // Create RunningHub task
      await createDirectUpscaleTask(upscaleItem.id, rhFileName);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI upscale failed";
      console.error(`[upscale ${upscaleItem.id}]`, error);
      await updateGalleryItem(upscaleItem.id, {
        status: "failed",
        progress: 100,
        message: "Upscale failed",
        error: message,
      });
    }
  })();

  return NextResponse.json(
    {
      ok: true,
      id: upscaleItem.id,
      status: upscaleItem.status,
      progress: upscaleItem.progress,
      message: "AI upscale queued. Check the Images gallery for progress.",
    },
    { status: 202 }
  );
}
