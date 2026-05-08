import { analyzeStyleReferences } from "@/lib/fashionVision";

type AzureImageItem = {
  b64_json?: string;
  b64?: string;
  url?: string;
};

type AzureImageResponse = {
  data?: AzureImageItem[];
  error?: { message?: string };
};

export type StoredImage = {
  name: string;
  type: string;
  bytes: ArrayBuffer;
};

export type ImageJob = {
  id: string;
  prompt: string;
  status: "queued" | "running" | "succeeded" | "failed";
  progress: number;
  message: string;
  createdAt: number;
  updatedAt: number;
  result?: {
    image: string;
    mimeType: string;
    prompt: string;
  };
  error?: string;
  errorCode?: "moderation_blocked";
};

type JobInput = {
  prompt: string;
  aspectRatio: string;
  quality: string;
  scene: string;
  subject: string;
  importantDetails: string;
  useCase: string;
  constraints: string;
  safetyMode: "creative" | "safe" | "catalog";
  generationFlow: "standard" | "staged";
  styleImages: StoredImage[];
  characterImages: StoredImage[];
};

type PromptSettings = Pick<JobInput, "prompt" | "aspectRatio" | "quality" | "scene" | "subject" | "importantDetails" | "useCase" | "constraints" | "safetyMode">;

const jobs = new Map<string, ImageJob>();
const requestTimes: number[] = [];

const maxUploadMb = Number(process.env.MAX_UPLOAD_MB ?? "8");
const maxReferenceImages = Number(process.env.MAX_REFERENCE_IMAGES ?? "12");
const generationRateLimitPerMinute = Number(process.env.GENERATION_RATE_LIMIT_PER_MINUTE ?? "8");
const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export function checkRateLimit() {
  const now = Date.now();
  const windowStart = now - 60_000;
  while (requestTimes.length > 0 && requestTimes[0] < windowStart) requestTimes.shift();
  if (requestTimes.length >= generationRateLimitPerMinute) return false;
  requestTimes.push(now);
  return true;
}

export function getJob(id: string) {
  pruneJobs();
  return jobs.get(id);
}

export async function createImageJob(formData: FormData) {
  const prompt = String(formData.get("prompt") ?? "").trim();
  const aspectRatio = String(formData.get("aspectRatio") ?? "").trim();
  const quality = String(formData.get("quality") ?? "").trim();
  const scene = String(formData.get("scene") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const importantDetails = String(formData.get("importantDetails") ?? "").trim();
  const useCase = String(formData.get("useCase") ?? "").trim();
  const constraints = String(formData.get("constraints") ?? "").trim();
  const safetyMode = resolveSafetyMode(String(formData.get("safetyMode") ?? "safe"));
  const requestedFlow = String(formData.get("generationFlow") ?? "staged");
  const generationFlow = requestedFlow === "standard" ? "standard" : "staged";

  const styleFiles = formData.getAll("styleImages").filter((item): item is File => item instanceof File && item.size > 0);
  const characterFiles = formData.getAll("characterImages").filter((item): item is File => item instanceof File && item.size > 0);
  const allFiles = [...styleFiles, ...characterFiles];

  if (prompt.length < 3 && styleFiles.length === 0) return { error: "Enter a prompt or upload a style reference image.", status: 400 } as const;
  if (prompt.length > 4000) return { error: "Prompt is too long. Keep it under 4000 characters.", status: 400 } as const;

  if (allFiles.length > maxReferenceImages) return { error: `Upload at most ${maxReferenceImages} reference images.`, status: 400 } as const;
  for (const file of allFiles) {
    if (!allowedTypes.has(file.type)) return { error: "Reference images must be PNG, JPEG, or WebP files.", status: 400 } as const;
    if (file.size > maxUploadMb * 1024 * 1024) return { error: `Each reference image must be ${maxUploadMb}MB or smaller.`, status: 400 } as const;
  }

  const input: JobInput = {
    prompt,
    aspectRatio,
    quality,
    scene,
    subject,
    importantDetails,
    useCase,
    constraints,
    safetyMode,
    generationFlow,
    styleImages: await Promise.all(styleFiles.map(fileToStoredImage)),
    characterImages: await Promise.all(characterFiles.map(fileToStoredImage)),
  };

  const id = crypto.randomUUID();
  const now = Date.now();
  jobs.set(id, {
    id,
    prompt,
    status: "queued",
    progress: 8,
    message: "Queued generation",
    createdAt: now,
    updatedAt: now,
  });

  void runJob(id, input);
  return { job: jobs.get(id)! } as const;
}

async function fileToStoredImage(file: File): Promise<StoredImage> {
  return {
    name: file.name,
    type: file.type,
    bytes: await file.arrayBuffer(),
  };
}

function setJob(id: string, updates: Partial<ImageJob>) {
  const current = jobs.get(id);
  if (!current) return;
  jobs.set(id, { ...current, ...updates, updatedAt: Date.now() });
}

async function runJob(id: string, input: JobInput) {
  try {
    setJob(id, { status: "running", progress: 18, message: "Preparing prompt and references" });
    const size = resolveAzureSize(input.aspectRatio, input.quality);
    const quality = resolveAzureQuality(input.quality);
    const useStagedFlow = input.generationFlow === "staged" && input.styleImages.length > 0;

    if (useStagedFlow) {
      setJob(id, { progress: 24, message: "Analyzing outfit reference" });
      const analyzedStyle = await analyzeStyleReferences(input.styleImages);
      const finalPrompt = buildPrompt(input, input.styleImages.length, input.characterImages.length, analyzedStyle, true);

      setJob(id, { progress: 36, message: "Creating safe fashion base image" });
      const heartbeat = startProgressHeartbeat(id);
      const baseResult = await callAzureGenerations(finalPrompt, size, quality);
      if ("error" in baseResult) throw new ImageGenerationError(baseResult.error ?? "Image generation failed", isModerationError(baseResult.error) ? "moderation_blocked" : undefined);
      const baseImage = await extractGeneratedImage(baseResult.data, input.prompt);

      if (input.characterImages.length === 0) {
        clearInterval(heartbeat);
        setJob(id, { status: "succeeded", progress: 100, message: "Image ready", result: { image: baseImage.image, mimeType: baseImage.mimeType, prompt: input.prompt } });
        return;
      }

      setJob(id, { progress: 68, message: "Applying character reference" });
      const editResult = await callAzureEdits(finalPrompt, [generatedImageToStoredImage(baseImage), ...input.characterImages], size, quality);
      clearInterval(heartbeat);
      if ("error" in editResult) throw new ImageGenerationError(editResult.error ?? "Image generation failed", isModerationError(editResult.error) ? "moderation_blocked" : undefined);

      setJob(id, { progress: 88, message: "Receiving generated image" });
      const finalImage = await extractGeneratedImage(editResult.data, input.prompt);
      setJob(id, { status: "succeeded", progress: 100, message: "Image ready", result: { image: finalImage.image, mimeType: finalImage.mimeType, prompt: input.prompt } });
      return;
    }

    const finalPrompt = buildPrompt(input, input.styleImages.length, input.characterImages.length);
    const allImages = [...input.styleImages, ...input.characterImages];

    setJob(id, { progress: 36, message: allImages.length ? "Sending references to Azure GPT Image" : "Sending prompt to Azure GPT Image" });
    const heartbeat = startProgressHeartbeat(id);
    const result = allImages.length > 0 ? await callAzureEdits(finalPrompt, allImages, size, quality) : await callAzureGenerations(finalPrompt, size, quality);
    clearInterval(heartbeat);
    if ("error" in result) throw new ImageGenerationError(result.error ?? "Image generation failed", isModerationError(result.error) ? "moderation_blocked" : undefined);

    setJob(id, { progress: 88, message: "Receiving generated image" });
    const image = await extractGeneratedImage(result.data, input.prompt);
    setJob(id, { status: "succeeded", progress: 100, message: "Image ready", result: { image: image.image, mimeType: image.mimeType, prompt: input.prompt } });
  } catch (error) {
    const isModerationBlocked = error instanceof ImageGenerationError && error.code === "moderation_blocked";
    setJob(id, {
      status: "failed",
      progress: 100,
      message: "Generation failed",
      error: isModerationBlocked ? moderationGuidance : error instanceof Error ? error.message : "Image generation failed",
      errorCode: isModerationBlocked ? "moderation_blocked" : undefined,
    });
  }
}


type GeneratedImage = {
  image: string;
  mimeType: string;
  prompt: string;
};

async function extractGeneratedImage(data: AzureImageResponse, prompt: string): Promise<GeneratedImage> {
  const first = data.data?.[0];
  const image = first?.b64_json ?? first?.b64;
  if (image) return { image, mimeType: "image/png", prompt };

  if (first?.url) {
    const imageResponse = await fetch(first.url);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    return { image: buffer.toString("base64"), mimeType: imageResponse.headers.get("content-type") ?? "image/png", prompt };
  }

  throw new Error("Azure did not return an image");
}

function generatedImageToStoredImage(image: GeneratedImage): StoredImage {
  return {
    name: "safe-fashion-base.png",
    type: image.mimeType,
    bytes: Uint8Array.from(Buffer.from(image.image, "base64")).buffer,
  };
}

function startProgressHeartbeat(id: string) {
  return setInterval(() => {
    const job = jobs.get(id);
    if (!job || job.status !== "running" || job.progress >= 84) return;
    setJob(id, {
      progress: job.progress + 1,
      message: job.progress > 68 ? "Still rendering details" : job.message,
    });
  }, 2500);
}

function buildPrompt(settings: PromptSettings, styleCount: number, characterCount: number, analyzedStyle = "", styleImagesAnalyzed = false) {
  if (settings.safetyMode === "catalog") return buildPromptFromSettings({ ...settings, prompt: sanitizeFashionPrompt(settings.prompt), constraints: strictCatalogConstraints(settings.constraints) }, styleCount, characterCount, "catalog", analyzedStyle, styleImagesAnalyzed);
  if (settings.safetyMode === "safe") return buildPromptFromSettings({ ...settings, prompt: sanitizeFashionPrompt(settings.prompt), constraints: sanitizeFashionPrompt(settings.constraints) }, styleCount, characterCount, "safe", analyzedStyle, styleImagesAnalyzed);
  return buildPromptFromSettings(settings, styleCount, characterCount, "creative", analyzedStyle, styleImagesAnalyzed);
}

function buildPromptFromSettings(settings: PromptSettings, styleCount: number, characterCount: number, safetyMode: "creative" | "safe" | "catalog", analyzedStyle = "", styleImagesAnalyzed = false) {
  const sections = [
    section("Creative direction", settings.prompt),
    section("Scene", settings.scene),
    section("Subject", settings.subject),
    section("Production details", settings.importantDetails),
    section("Use case", settings.useCase),
    section("Constraints", settings.constraints),
    section("Safety and styling requirements", safeFashionRequirements(safetyMode)),
    section("Reference-derived fashion specification", analyzedStyle),
  ].filter(Boolean) as string[];

  const referenceInstructions: string[] = [];
  if (styleImagesAnalyzed && styleCount > 0) {
    referenceInstructions.push(
      `Use the reference-derived fashion specification as visual direction for garment design, styling, scene, lighting, camera angle, composition, mood, and campaign look. The original style reference image${styleCount > 1 ? "s were" : " was"} analyzed into text and should not be treated as direct edit input.`
    );
  } else if (styleCount > 0) {
    referenceInstructions.push(
      `Use the ${styleCount} style reference image${styleCount > 1 ? "s" : ""} as visual direction for the editorial pose, scene, lighting, setting, garment styling, composition, color palette, camera angle, and mood. Create a new original professional fashion/editorial image inspired by those production choices rather than copying or editing the source photo directly.`
    );
  }
  if (characterCount > 0) {
    referenceInstructions.push(
      `Use the ${characterCount} character reference image${characterCount > 1 ? "s" : ""} for recognizable identity, hairstyle, complexion, age range, general silhouette, posture, and styling continuity in a professional non-explicit editorial image. Do not paste, swap, or composite faces or bodies from separate images.`
    );
  }
  if (referenceInstructions.length > 0) sections.push(section("Reference-image instructions", referenceInstructions.join(" "))!);

  const format = [settings.aspectRatio ? `Format: ${settings.aspectRatio}.` : "", settings.quality ? `Quality/detail target: ${settings.quality}.` : ""].filter(Boolean).join(" ");
  if (format) sections.push(section("Aspect ratio and quality instructions", format)!);

  return sections.join("\n\n");
}

function safeFashionRequirements(safetyMode: "creative" | "safe" | "catalog") {
  const base = "Professional fashion/editorial or commercial campaign image with adult-presenting subjects only, non-explicit styling, no nudity, no sexualized framing, no intimate anatomy emphasis, no voyeuristic angle, no fetish styling, and no minors. Keep pose, wardrobe, lighting, and camera language suitable for a mainstream brand campaign.";
  if (safetyMode === "catalog") return `${base} Conservative catalog-safe output: opaque everyday or formal clothing, full coverage styling, neutral standing or walking pose, relaxed arms, camera at eye level, no reclining pose, no bedroom/private setting, no lingerie, no swimwear, no sheer fabric, no exposed underwear, no wet-clothing look, no close crop on chest/hips/legs, and no flirtatious expression. Prioritize garment, silhouette, lighting, composition, and brand-safe styling.`;
  return safetyMode === "safe" ? `${base} Use conservative editorial wording and prioritize garment, silhouette, lighting, composition, and brand-safe styling over body-description terms.` : base;
}

function strictCatalogConstraints(constraints: string) {
  return [
    sanitizeFashionPrompt(constraints),
    "Opaque clothing only, full coverage fashion styling, neutral standing/walking pose, eye-level camera, public studio or outdoor campaign setting, no lingerie, no swimwear, no sheer fabric, no exposed underwear, no wet-clothing effect, no reclining pose, no bedroom/private setting, no close crop on chest/hips/legs.",
  ]
    .filter(Boolean)
    .join(" ");
}

function sanitizeFashionPrompt(prompt: string) {
  return prompt
    .replace(/\bsexy\b/gi, "elegant")
    .replace(/\bsensual\b/gi, "refined")
    .replace(/\bseductive\b/gi, "confident")
    .replace(/\berotic\b/gi, "editorial")
    .replace(/\blingerie\b/gi, "fashion outfit")
    .replace(/\bunderwear\b/gi, "fashion outfit")
    .replace(/\bnude\b/gi, "neutral-toned")
    .replace(/\bnaked\b/gi, "minimally styled")
    .replace(/\bbody\b/gi, "silhouette")
    .replace(/\banatomy\b/gi, "silhouette")
    .replace(/\bcurves?\b/gi, "garment shape")
    .replace(/\bskin\b/gi, "complexion")
    .replace(/\bprovocative\b/gi, "high-fashion")
    .replace(/\bracy\b/gi, "bold editorial");
}

class ImageGenerationError extends Error {
  constructor(message: string, readonly code?: "moderation_blocked") {
    super(message);
  }
}

const moderationGuidance = "Azure blocked this request with its image safety filter. Try Safe Fashion or Conservative Catalog mode, and avoid nudity, lingerie, swimwear, sheer/wet clothing, sexualized poses, minors, or body-anatomy wording.";

function resolveSafetyMode(value: string) {
  if (value === "creative" || value === "catalog") return value;
  return "safe";
}

function isModerationError(message: string | undefined) {
  return /moderation|content.?filter|safety|responsible ai|policy|rai/i.test(message ?? "");
}

function section(title: string, value: string) {
  const trimmed = value.trim();
  return trimmed ? `${title}:\n${trimmed}` : null;
}

function resolveAzureSize(aspectRatio: string, quality: string) {
  const wantsPortrait = /9:16|4:5|2:3/i.test(aspectRatio);
  const wantsLandscape = /16:9|3:2|3:1|21:9|1\.91:1/i.test(aspectRatio);
  const wantsLarge = /2K|4K/i.test(quality);

  if (wantsPortrait) return wantsLarge ? "1024x1536" : "1024x1536";
  if (wantsLandscape) return wantsLarge ? "1536x1024" : "1536x1024";
  return wantsLarge ? "1024x1024" : "1024x1024";
}

function resolveAzureQuality(quality: string) {
  if (/1K|draft|fast/i.test(quality)) return "low";
  if (/2K|social|detailed/i.test(quality)) return "medium";
  return "high";
}

async function callAzureGenerations(prompt: string, size: string, quality: string) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-image-2";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview";

  if (!endpoint || !apiKey) return { error: "Azure image generation is not configured", status: 500 } as const;

  const response = await throttleAzureImageRequest(() => fetch(`${endpoint}/openai/deployments/${deployment}/images/generations?api-version=${apiVersion}`, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, n: 1, size, quality, output_format: "png" }),
  }));

  const data = (await response.json()) as AzureImageResponse;
  if (!response.ok) return { error: data.error?.message ?? "Azure image generation failed", status: response.status } as const;
  return { data } as const;
}

async function callAzureEdits(prompt: string, files: StoredImage[], size: string, quality: string) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-image-2";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview";

  if (!endpoint || !apiKey) return { error: "Azure image generation is not configured", status: 500 } as const;

  const body = new FormData();
  body.set("prompt", prompt);
  body.set("n", "1");
  body.set("size", size);
  body.set("quality", quality);
  body.set("input_fidelity", "low");
  body.set("output_format", "png");
  files.forEach((file) => body.append("image[]", new Blob([file.bytes], { type: file.type }), file.name));

  const response = await throttleAzureImageRequest(() => fetch(`${endpoint}/openai/deployments/${deployment}/images/edits?api-version=${apiVersion}`, {
    method: "POST",
    headers: { "api-key": apiKey },
    body,
  }));

  const data = (await response.json()) as AzureImageResponse;
  if (!response.ok) return { error: data.error?.message ?? "Azure referenced image generation failed", status: response.status } as const;
  return { data } as const;
}

let azureQueue = Promise.resolve();
let lastAzureImageRequestAt = 0;
const minAzureImageRequestSpacingMs = Number(process.env.AZURE_IMAGE_MIN_REQUEST_SPACING_MS ?? "6500");

function throttleAzureImageRequest<T>(request: () => Promise<T>) {
  const run = azureQueue.then(async () => {
    const waitMs = Math.max(0, minAzureImageRequestSpacingMs - (Date.now() - lastAzureImageRequestAt));
    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastAzureImageRequestAt = Date.now();
    return request();
  });
  azureQueue = run.then(() => undefined, () => undefined);
  return run;
}

function pruneJobs() {
  const cutoff = Date.now() - 30 * 60_000;
  for (const [id, job] of jobs) {
    if (job.updatedAt < cutoff) jobs.delete(id);
  }
}
