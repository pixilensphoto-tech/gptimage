import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const apiUrl = process.env.CODEX_API_URL?.replace(/\/$/, "");
  if (!apiUrl) {
    return jsonError("CODEX_API_URL is not configured", 500);
  }

  const payload = await request.json();
  const response = await fetch(`${apiUrl}/v1/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
