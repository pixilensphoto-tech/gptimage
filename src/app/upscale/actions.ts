"use server";

import { createGalleryItem } from "@/lib/galleryDb";
import { uploadToRunningHub, createDirectUpscaleTask } from "@/lib/directRunningHub";
import { redirect } from "next/navigation";

export async function upscaleAction(formData: FormData) {
  console.log("!!!LOG!!! [upscaleAction] started");
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  try {
    // 1. Create gallery placeholder
    const item = await createGalleryItem({
      generator: "upscale_direct",
      status: "pending",
      progress: 5,
      message: "Starting direct upscale",
      metadata: { originalName: file.name },
    });

    console.log("!!!LOG!!! [upscaleAction] placeholder created:", item.id);

    // 2. Upload to RH
    const buffer = Buffer.from(await file.arrayBuffer());
    const rhFileName = await uploadToRunningHub(buffer, file.name);

    console.log("!!!LOG!!! [upscaleAction] uploaded to RH:", rhFileName);

    // 3. Create Task
    await createDirectUpscaleTask(item.id, rhFileName);

    console.log("!!!LOG!!! [upscaleAction] task created, redirecting...");
  } catch (e) {
    console.error("!!!LOG!!! [upscaleAction] failed", e);
    throw e;
  }

  redirect("/images");
}
