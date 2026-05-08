import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

export const runtime = "nodejs";

type ImageResult = {
  title: string;
  thumbnail: string;
  imageUrl: string;
  sourceUrl: string;
};

type CacheEntry = {
  expiresAt: number;
  results: ImageResult[];
};

const cache = new Map<string, CacheEntry>();
const cacheTtlMs = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const count = Math.min(30, Math.max(1, Number(request.nextUrl.searchParams.get("count") ?? "24")));

  if (query.length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters." }, { status: 400 });
  }

  const cacheKey = `${query.toLowerCase()}::${count}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ query, results: cached.results, cached: true });
  }

  const results = await scrapeGoogleImages(query, count);
  if (results.length === 0) {
    return NextResponse.json(
      { error: "No image results could be parsed. Google may have changed markup or blocked the request.", query, results: [] },
      { status: 502 }
    );
  }

  cache.set(cacheKey, { expiresAt: Date.now() + cacheTtlMs, results });
  return NextResponse.json({ query, results, cached: false });
}

async function scrapeGoogleImages(query: string, count: number): Promise<ImageResult[]> {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium-browser";
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1365, height: 900 },
    });

    const url = new URL("https://www.google.com/search");
    url.searchParams.set("tbm", "isch");
    url.searchParams.set("q", query);
    url.searchParams.set("safe", "active");
    url.searchParams.set("hl", "en");
    url.searchParams.set("gl", "us");

    await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: 25_000 });
    await page.waitForTimeout(1500);
    for (let i = 0; i < 3; i += 1) {
      await page.mouse.wheel(0, 1400);
      await page.waitForTimeout(500);
    }

    const results = await page.evaluate((maxCount) => {
      const seen = new Set<string>();
      const output: ImageResult[] = [];
      const images = Array.from(document.querySelectorAll("img")) as HTMLImageElement[];

      for (const img of images) {
        const thumbnail = img.currentSrc || img.src || img.dataset.src || "";
        if (!thumbnail || thumbnail.startsWith("data:")) continue;
        if (img.naturalWidth < 80 || img.naturalHeight < 80) continue;

        const anchor = img.closest("a") as HTMLAnchorElement | null;
        const href = anchor?.getAttribute("href") || "";
        const urlParams = href.includes("?") ? new URLSearchParams(href.split("?")[1]) : null;
        const imageUrl = urlParams?.get("imgurl") || thumbnail;
        const sourceUrl = urlParams?.get("imgrefurl") || urlParams?.get("url") || anchor?.href || imageUrl;
        if (seen.has(imageUrl)) continue;
        seen.add(imageUrl);

        let title = img.alt || "Image result";
        try {
          title = img.alt || new URL(sourceUrl, location.href).hostname.replace(/^www\./, "");
        } catch {}

        output.push({ title, thumbnail, imageUrl, sourceUrl });
        if (output.length >= maxCount) break;
      }

      return output;
    }, count);

    return normalizeResults(results).slice(0, count);
  } finally {
    await browser.close();
  }
}

function normalizeResults(results: ImageResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (!isHttpUrl(result.imageUrl) || !isHttpUrl(result.thumbnail) || seen.has(result.imageUrl)) return false;
    seen.add(result.imageUrl);
    return true;
  });
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}
