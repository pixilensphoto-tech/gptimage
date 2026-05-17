import { NextResponse } from "next/server";
import { deleteGalleryItem, getGalleryItem } from "@/lib/galleryDb";

type ImgBbMetadata = {
  url?: string;
  viewerUrl?: string;
  displayUrl?: string;
  deleteUrl?: string;
};

function getDeleteUrl(metadata: Record<string, unknown>): string | null {
  const result = metadata.result;
  if (!result || typeof result !== "object") return null;

  const resultRecord = result as Record<string, unknown>;
  const chainedTryOn = resultRecord.chainedTryOn;

  const candidates = [
    resultRecord.imgbb,
    chainedTryOn && typeof chainedTryOn === "object" ? (chainedTryOn as Record<string, unknown>).imgbb : null,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const imgbb = candidate as ImgBbMetadata;
    if (typeof imgbb.deleteUrl === "string" && imgbb.deleteUrl.trim()) {
      return imgbb.deleteUrl;
    }
  }

  return null;
}

async function deleteRemoteImage(deleteUrl: string) {
  const response = await fetch(deleteUrl, {
    method: "GET",
    cache: "no-store",
  });

  if (response.ok || response.status === 404) {
    return { ok: true as const };
  }

  const text = await response.text();
  return {
    ok: false as const,
    error: text || `ImgBB delete failed with status ${response.status}`,
  };
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await getGalleryItem(id);

  if (!item) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const deleteUrl = getDeleteUrl(item.metadata);
  let remoteCleanup = "not_available";
  let warning: string | undefined;

  if (deleteUrl) {
    const remoteResult = await deleteRemoteImage(deleteUrl);
    if (!remoteResult.ok) {
      return NextResponse.json({ error: remoteResult.error }, { status: 502 });
    }
    remoteCleanup = "deleted";
  } else if (item.imageUrl) {
    warning = "Image deleted locally, but remote ImgBB cleanup was unavailable for this record.";
  }

  await deleteGalleryItem(id);

  return NextResponse.json({ ok: true, remoteCleanup, warning });
}
