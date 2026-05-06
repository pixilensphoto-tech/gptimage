import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type AzureImageItem = {
  b64_json?: string;
  b64?: string;
  url?: string;
};

type AzureImageResponse = {
  data?: AzureImageItem[];
  error?: { message?: string };
};

const requestTimes: number[] = [];

const maxUploadMb = Number(process.env.MAX_UPLOAD_MB ?? "8");
const maxReferenceImages = Number(process.env.MAX_REFERENCE_IMAGES ?? "6");
const generationRateLimitPerMinute = Number(process.env.GENERATION_RATE_LIMIT_PER_MINUTE ?? "8");
const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function checkRateLimit() {
  const now = Date.now();
  const windowStart = now - 60_000;
  while (requestTimes.length > 0 && requestTimes[0] < windowStart) {
    requestTimes.shift();
  }
  if (requestTimes.length >= generationRateLimitPerMinute) {
    return false;
  }
  requestTimes.push(now);
  return true;
}

function buildPrompt(prompt: string, styleCount: number, characterCount: number) {
  const sections = [prompt];
  if (styleCount > 0) {
    sections.push(`Use the ${styleCount} style reference image${styleCount > 1 ? "s" : ""} for visual language, lighting, color palette, texture, and mood.`);
  }
  if (characterCount > 0) {
    sections.push(`Use the ${characterCount} character reference image${characterCount > 1 ? "s" : ""} to preserve identity, wardrobe, proportions, or product details where relevant.`);
  }
  return sections.join("\n\n");
}

async function callAzureGenerations(prompt: string) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-image-2";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview";

  if (!endpoint || !apiKey) {
    return { error: "Azure image generation is not configured", status: 500 } as const;
  }

  const response = await fetch(`${endpoint}/openai/deployments/${deployment}/images/generations?api-version=${apiVersion}`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      n: 1,
      size: "1024x1024",
      output_format: "png",
    }),
  });

  const data = (await response.json()) as AzureImageResponse;
  if (!response.ok) {
    return { error: data.error?.message ?? "Azure image generation failed", status: response.status } as const;
  }

  return { data } as const;
}

async function callAzureEdits(prompt: string, files: File[]) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-image-2";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview";

  if (!endpoint || !apiKey) {
    return { error: "Azure image generation is not configured", status: 500 } as const;
  }

  const body = new FormData();
  body.set("prompt", prompt);
  body.set("n", "1");
  body.set("size", "1024x1024");
  body.set("output_format", "png");
  files.forEach((file) => body.append("image[]", file, file.name));

  const response = await fetch(`${endpoint}/openai/deployments/${deployment}/images/edits?api-version=${apiVersion}`, {
    method: "POST",
    headers: { "api-key": apiKey },
    body,
  });

  const data = (await response.json()) as AzureImageResponse;
  if (!response.ok) {
    return { error: data.error?.message ?? "Azure referenced image generation failed", status: response.status } as const;
  }

  return { data } as const;
}

export async function POST(request: NextRequest) {
  if (!checkRateLimit()) {
    return jsonError("Too many generation requests. Please wait a minute and try again.", 429);
  }

  const formData = await request.formData();
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (prompt.length < 3) {
    return jsonError("Enter a more detailed prompt.");
  }
  if (prompt.length > 4000) {
    return jsonError("Prompt is too long. Keep it under 4000 characters.");
  }

  const styleImages = formData.getAll("styleImages").filter((item): item is File => item instanceof File && item.size > 0);
  const characterImages = formData.getAll("characterImages").filter((item): item is File => item instanceof File && item.size > 0);
  const allImages = [...styleImages, ...characterImages];

  if (allImages.length > maxReferenceImages) {
    return jsonError(`Upload at most ${maxReferenceImages} reference images.`);
  }

  for (const file of allImages) {
    if (!allowedTypes.has(file.type)) {
      return jsonError("Reference images must be PNG, JPEG, or WebP files.");
    }
    if (file.size > maxUploadMb * 1024 * 1024) {
      return jsonError(`Each reference image must be ${maxUploadMb}MB or smaller.`);
    }
  }

  const finalPrompt = buildPrompt(prompt, styleImages.length, characterImages.length);
  const result = allImages.length > 0 ? await callAzureEdits(finalPrompt, allImages) : await callAzureGenerations(finalPrompt);
  if ("error" in result) {
    return jsonError(result.error ?? "Image generation failed", result.status);
  }

  const first = result.data.data?.[0];
  const image = first?.b64_json ?? first?.b64;
  if (image) {
    return NextResponse.json({ id: crypto.randomUUID(), image, mimeType: "image/png", prompt });
  }

  if (first?.url) {
    const imageResponse = await fetch(first.url);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    return NextResponse.json({ id: crypto.randomUUID(), image: buffer.toString("base64"), mimeType: imageResponse.headers.get("content-type") ?? "image/png", prompt });
  }

  return jsonError("Azure did not return an image", 502);
}
