import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getEnv(key: string): string | undefined {
  const val = process.env[key];
  if (!val) return undefined;
  try {
    const decoded = Buffer.from(val, "base64").toString("utf-8");
    const ratio = decoded.length / val.length;
    const validLength = ratio > 0.5 && ratio < 1.0;
    const validUtf8 = !decoded.includes("�");
    if (validUtf8 && validLength && decoded !== val) return decoded;
  } catch {}
  return val;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const apiUrl = (
    getEnv("CODEX_TRYON_API_URL") ??
    "https://codeximageapi.pixilens.online"
  ).replace(/\/$/, "");
  const apiKey = getEnv("CODEX_API_KEY");
  if (!apiUrl) {
    return jsonError("CODEX_TRYON_API_URL is not configured", 500);
  }
  if (!apiKey) {
    return jsonError("CODEX_API_KEY is not configured", 500);
  }

  const payload = await request.json();
  const modelImage = payload?.modelImage ?? payload?.identityImage;
  const outfitImage = payload?.outfitImage;
  const body = {
    identityImages: modelImage ? [modelImage] : [],
    outfitImage,
    bypassCodex: true,
    name: typeof payload?.name === "string" ? payload.name : undefined,
    category: typeof payload?.category === "string" ? payload.category : undefined,
  };

  const response = await fetch(`${apiUrl}/v1/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
    },
  });
}
