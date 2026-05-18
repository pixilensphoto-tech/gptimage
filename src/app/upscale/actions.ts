import { createGalleryItem } from "@/lib/galleryDb";
import { uploadToRunningHub, createDirectUpscaleTask } from "@/lib/directRunningHub";
import { redirect } from "next/navigation";

export async function upscaleAction(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  // 1. Create gallery placeholder
  const item = await createGalleryItem({
    generator: "upscale_direct",
    status: "pending",
    progress: 5,
    message: "Starting direct upscale",
    metadata: { originalName: file.name },
  });

  // 2. Upload to RH
  const buffer = Buffer.from(await file.arrayBuffer());
  const rhFileName = await uploadToRunningHub(buffer, file.name);

  // 3. Create Task
  await createDirectUpscaleTask(item.id, rhFileName);

  redirect("/images");
}
