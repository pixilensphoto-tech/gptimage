import { analyzeStyleReferencesByRole } from "@/lib/fashionVision";

function getEnv(key: string): string | undefined {
  const val = process.env[key];
  if (!val) return undefined;
  // Coolify may store values as Base64-encoded. If decoding produces a different
  // string, it was encoded — return the decoded plain text value.
  try {
    const decoded = Buffer.from(val, "base64").toString("utf-8");
    if (decoded !== val) return decoded;
  } catch { /* ignore */ }
  return val;
}

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
  sceneImages: StoredImage[];
  poseImages: StoredImage[];
  outfitImages: StoredImage[];
  characterImages: StoredImage[];
  useSceneOnlySource: boolean;
};

type PromptSettings = Pick<JobInput, "prompt" | "aspectRatio" | "quality" | "scene" | "subject" | "importantDetails" | "useCase" | "constraints" | "safetyMode">;

type ReferenceContext = {
  sceneCount: number;
  poseCount: number;
  outfitCount: number;
  characterCount: number;
  analyzedStyle?: string;
  styleImagesAnalyzed?: boolean;
  useSceneOnlySource?: boolean;
};

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

  const sceneFiles = formData.getAll("sceneImages").filter((item): item is File => item instanceof File && item.size > 0);
  const poseFiles = formData.getAll("poseImages").filter((item): item is File => item instanceof File && item.size > 0);
  const outfitFiles = formData.getAll("outfitImages").filter((item): item is File => item instanceof File && item.size > 0);
  const legacyStyleFiles = formData.getAll("styleImages").filter((item): item is File => item instanceof File && item.size > 0);
  const characterFiles = formData.getAll("characterImages").filter((item): item is File => item instanceof File && item.size > 0);
  const roleFiles = [...sceneFiles, ...poseFiles, ...outfitFiles, ...legacyStyleFiles];
  const allFiles = [...roleFiles, ...characterFiles];
  const useSceneOnlySource = String(formData.get("useSceneOnlySource") ?? "false") === "true";

  if (prompt.length < 3 && roleFiles.length === 0) return { error: "Enter a prompt or upload a Scene/Bg, Pose, or Outfit reference image.", status: 400 } as const;
  if (useSceneOnlySource && sceneFiles.length === 0) return { error: "Upload Image 1 Scene/Bg before using it as the only source.", status: 400 } as const;
  if (sceneFiles.length > 1 || poseFiles.length > 1 || outfitFiles.length > 1) return { error: "Upload at most one image for each Scene/Bg, Pose, and Outfit slot.", status: 400 } as const;
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
    sceneImages: await Promise.all(sceneFiles.map(fileToStoredImage)),
    poseImages: await Promise.all(poseFiles.map(fileToStoredImage)),
    outfitImages: await Promise.all([...outfitFiles, ...legacyStyleFiles].map(fileToStoredImage)),
    characterImages: await Promise.all(characterFiles.map(fileToStoredImage)),
    useSceneOnlySource,
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
    const roleImageCount = input.sceneImages.length + input.poseImages.length + input.outfitImages.length;
    const useStagedFlow = input.generationFlow === "staged" && roleImageCount > 0;

    if (useStagedFlow) {
      setJob(id, { progress: 24, message: "Analyzing scene, pose, and outfit references" });
      const analyzedStyle = await analyzeStyleReferencesByRole({
        sceneImages: input.sceneImages,
        poseImages: input.poseImages,
        outfitImages: input.outfitImages,
        useSceneOnlySource: input.useSceneOnlySource,
      });
      const finalPrompt = buildPrompt(input, { sceneCount: input.sceneImages.length, poseCount: input.poseImages.length, outfitCount: input.outfitImages.length, characterCount: input.characterImages.length, analyzedStyle, styleImagesAnalyzed: true, useSceneOnlySource: input.useSceneOnlySource });

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
      const characterPrompt = buildCharacterEditPrompt(finalPrompt, input.characterImages.length);
      const editResult = await callAzureEdits(characterPrompt, [...input.characterImages, generatedImageToStoredImage(baseImage)], size, quality);
      clearInterval(heartbeat);
      if ("error" in editResult) throw new ImageGenerationError(editResult.error ?? "Image generation failed", isModerationError(editResult.error) ? "moderation_blocked" : undefined);

      setJob(id, { progress: 88, message: "Receiving generated image" });
      const finalImage = await extractGeneratedImage(editResult.data, input.prompt);
      setJob(id, { status: "succeeded", progress: 100, message: "Image ready", result: { image: finalImage.image, mimeType: finalImage.mimeType, prompt: input.prompt } });
      return;
    }

    const finalPrompt = buildPrompt(input, { sceneCount: input.sceneImages.length, poseCount: input.poseImages.length, outfitCount: input.outfitImages.length, characterCount: input.characterImages.length });
    const allImages = [...input.sceneImages, ...input.poseImages, ...input.outfitImages, ...input.characterImages];

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


function buildCharacterEditPrompt(basePrompt: string, characterCount: number) {
  return [
    basePrompt,
    "Character reference priority:",
    `Use the ${characterCount} character reference image${characterCount > 1 ? "s" : ""} as the primary source for identity, face, hairstyle, complexion, age range, and recognizable person continuity.`,
    "Use the generated base image only for scene, outfit, pose, lighting, composition, and overall production direction. Replace any person identity from the generated base with the character reference identity.",
    "Keep the result as a natural professional fashion/editorial image; do not create a face paste, head swap, or visible composite.",
  ].join("\n\n");
}

function buildPrompt(settings: PromptSettings, references: ReferenceContext) {
  if (settings.safetyMode === "catalog") return buildPromptFromSettings({ ...settings, prompt: sanitizeFashionPrompt(settings.prompt), constraints: strictCatalogConstraints(settings.constraints) }, references, "catalog");
  if (settings.safetyMode === "safe") return buildPromptFromSettings({ ...settings, prompt: sanitizeFashionPrompt(settings.prompt), constraints: sanitizeFashionPrompt(settings.constraints) }, references, "safe");
  return buildPromptFromSettings(settings, references, "creative");
}

function buildPromptFromSettings(settings: PromptSettings, references: ReferenceContext, safetyMode: "creative" | "safe" | "catalog") {
  const sections = [
    section("Creative direction", settings.prompt),
    section("Scene", settings.scene),
    section("Subject", settings.subject),
    section("Production details", settings.importantDetails),
    section("Use case", settings.useCase),
    section("Constraints", settings.constraints),
    section("Safety and styling requirements", safeFashionRequirements(safetyMode)),
    section("Reference-derived role specification", references.analyzedStyle ?? ""),
  ].filter(Boolean) as string[];

  const roleCount = references.sceneCount + references.poseCount + references.outfitCount;
  const referenceInstructions: string[] = [];
  if (references.styleImagesAnalyzed && roleCount > 0) {
    referenceInstructions.push(
      "Use the reference-derived role specification as text direction. Image 1 Scene/Bg controls scene, background, lighting, camera mood, and composition. Image 2 Pose controls only posture, framing, camera angle, and subject placement. Image 3 Outfit controls only garment design, fabric, color, styling, accessories, and footwear. Do not treat Scene/Pose/Outfit references as direct edit inputs."
    );
    if (references.useSceneOnlySource) {
      referenceInstructions.push("Source priority: Image 1 Scene/Bg is the primary base visual source. Pose and Outfit notes are secondary text-only direction and must not override Image 1's scene/background direction.");
    }
  } else if (roleCount > 0) {
    referenceInstructions.push(
      `Use the ${roleCount} role reference image${roleCount > 1 ? "s" : ""} only according to their assigned Scene/Bg, Pose, or Outfit purpose. Create a new original professional fashion/editorial image inspired by those production choices rather than copying or editing the source photo directly.`
    );
  }
  if (references.characterCount > 0) {
    referenceInstructions.push(
      `Use the ${references.characterCount} character reference image${references.characterCount > 1 ? "s" : ""} for recognizable identity, hairstyle, complexion, age range, general silhouette, posture, and styling continuity in a professional non-explicit editorial image. Do not paste, swap, or composite faces or bodies from separate images.`
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
  // Use new Azure Foundry endpoint for gpt2
  // FOUNDRY_* env vars may be Base64-encoded by Coolify — decode them at runtime
  const endpoint = (getEnv("FOUNDRY_OPENAI_ENDPOINT") ?? process.env.AZURE_OPENAI_ENDPOINT)?.replace(/\/$/, "");
  const apiKey = getEnv("FOUNDRY_OPENAI_API_KEY") ?? process.env.AZURE_OPENAI_API_KEY;
  const deployment = getEnv("FOUNDRY_OPENAI_DEPLOYMENT") ?? "gpt-image-2";
  const apiVersion = getEnv("FOUNDRY_OPENAI_API_VERSION") ?? "2025-04-01-preview";

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
  // Use new Azure Foundry endpoint for gpt2
  // FOUNDRY_* env vars may be Base64-encoded by Coolify — decode them at runtime
  const endpoint = (getEnv("FOUNDRY_OPENAI_ENDPOINT") ?? process.env.AZURE_OPENAI_ENDPOINT)?.replace(/\/$/, "");
  const apiKey = getEnv("FOUNDRY_OPENAI_API_KEY") ?? process.env.AZURE_OPENAI_API_KEY;
  const deployment = getEnv("FOUNDRY_OPENAI_DEPLOYMENT") ?? "gpt-image-2";
  const apiVersion = getEnv("FOUNDRY_OPENAI_API_VERSION") ?? "2025-04-01-preview";

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