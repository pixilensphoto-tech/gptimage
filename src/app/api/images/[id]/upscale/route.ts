import { NextResponse } from "next/server";
import { getGalleryItem, createGalleryItem, updateGalleryItem } from "@/lib/galleryDb";
import { uploadToRunningHub, createDirectUpscaleTask } from "@/lib/directRunningHub";
import https from "node:https";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await getGalleryItem(id);

  if (!item) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  if (!item.imageUrl) {
    return NextResponse.json({ error: "This image does not have a source file to upscale yet" }, { status: 400 });
  }

  // Check if image URL is publicly accessible (not internal/private)
  if (item.imageUrl.includes("150.220.93.109") || item.imageUrl.includes("localhost") || item.imageUrl.includes("127.0.0.1")) {
    return NextResponse.json({ error: "Cannot upscale: source image is on an internal server and not publicly accessible" }, { status: 400 });
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

      // Download image using https (more reliable in containerized environments)
      const imageBuffer = await new Promise<Buffer>((resolve, reject) => {
        https.get(item.imageUrl!, (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`Failed to download source image: ${res.statusCode}`));
            return;
          }
          const chunks: Buffer[] = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }).on('error', reject);
      });

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
      const stack = error instanceof Error ? error.stack : undefined;
      console.error(`[upscale ${upscaleItem.id}]`, error);
      await updateGalleryItem(upscaleItem.id, {
        status: "failed",
        progress: 100,
        message: "Upscale failed",
        error: message,
        metadata: {
          source: { id: item.id, imageUrl: item.imageUrl },
          errorDetails: message,
          errorStack: stack,
          failedAt: new Date().toISOString()
        },
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
