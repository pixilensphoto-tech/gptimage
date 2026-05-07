import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type JsonImageRequest = {
  apiKey?: string;
  prompt?: string;
  sourceImage?: string;
};

type AzureImageResponse = {
  data?: Array<{ b64_json?: string; b64?: string; url?: string }>;
  error?: { message?: string };
};

const maxSourceImageBytes = 8 * 1024 * 1024;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const expectedApiKey = process.env.GPTIMAGE_API_KEY;
  if (!expectedApiKey) return jsonError("JSON image API is not configured", 500);

  const payload = (await request.json().catch(() => null)) as JsonImageRequest | null;
  if (!payload) return jsonError("Request body must be JSON");
  if (payload.apiKey !== expectedApiKey) return jsonError("Invalid API key", 401);

  const prompt = payload.prompt?.trim();
  if (!prompt || prompt.length < 3) return jsonError("prompt is required");
  if (prompt.length > 4000) return jsonError("prompt must be 4000 characters or fewer");

  const sourceImage = payload.sourceImage?.trim();
  if (!sourceImage) return jsonError("sourceImage is required as a base64 string or data URL");

  const parsedImage = parseSourceImage(sourceImage);
  if (!parsedImage) return jsonError("sourceImage must be a valid base64 image or data URL");
  if (parsedImage.bytes.length > maxSourceImageBytes) return jsonError("sourceImage must be 8MB or smaller after base64 decoding");

  const result = await callAzureImageEdit(prompt, parsedImage);
  if ("error" in result) return jsonError(result.error ?? "Image generation failed", result.status);

  const first = result.data.data?.[0];
  const image = first?.b64_json ?? first?.b64;
  if (image) {
    return NextResponse.json({ image, mimeType: "image/png", prompt });
  }

  if (first?.url) {
    const imageResponse = await fetch(first.url);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    return NextResponse.json({ image: buffer.toString("base64"), mimeType: imageResponse.headers.get("content-type") ?? "image/png", prompt });
  }

  return jsonError("Azure did not return an image", 502);
}

function parseSourceImage(sourceImage: string) {
  const dataUrlMatch = sourceImage.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i);
  const mimeType = dataUrlMatch?.[1] ?? "image/png";
  const base64 = dataUrlMatch?.[2] ?? sourceImage;

  try {
    const bytes = Buffer.from(base64, "base64");
    if (bytes.length === 0) return null;
    return { bytes, mimeType };
  } catch {
    return null;
  }
}

async function callAzureImageEdit(prompt: string, sourceImage: { bytes: Buffer; mimeType: string }) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-image-2";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview";

  if (!endpoint || !apiKey) return { error: "Azure image generation is not configured", status: 500 } as const;

  const body = new FormData();
  body.set("prompt", prompt);
  body.set("n", "1");
  body.set("size", "1024x1536");
  body.set("output_format", "png");
  const imageBytes = new Uint8Array(sourceImage.bytes);
  body.append("image[]", new Blob([imageBytes], { type: sourceImage.mimeType }), "source-image");

  const response = await fetch(`${endpoint}/openai/deployments/${deployment}/images/edits?api-version=${apiVersion}`, {
    method: "POST",
    headers: { "api-key": apiKey },
    body,
  });

  const data = (await response.json()) as AzureImageResponse;
  if (!response.ok) return { error: data.error?.message ?? "Azure image generation failed", status: response.status } as const;
  return { data } as const;
}
