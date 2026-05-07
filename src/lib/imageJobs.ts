type AzureImageItem = {
  b64_json?: string;
  b64?: string;
  url?: string;
};

type AzureImageResponse = {
  data?: AzureImageItem[];
  error?: { message?: string };
};

type StoredImage = {
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
  styleImages: StoredImage[];
  characterImages: StoredImage[];
};

type PromptSettings = Pick<JobInput, "prompt" | "aspectRatio" | "quality" | "scene" | "subject" | "importantDetails" | "useCase" | "constraints">;

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
    const finalPrompt = buildPrompt(input, input.styleImages.length, input.characterImages.length);
    const size = resolveAzureSize(input.aspectRatio, input.quality);
    const allImages = [...input.styleImages, ...input.characterImages];

    setJob(id, { progress: 36, message: allImages.length ? "Sending references to Azure GPT Image" : "Sending prompt to Azure GPT Image" });
    const heartbeat = startProgressHeartbeat(id);
    const result = allImages.length > 0 ? await callAzureEdits(finalPrompt, allImages, size) : await callAzureGenerations(finalPrompt, size);
    clearInterval(heartbeat);
    if ("error" in result) throw new Error(result.error ?? "Image generation failed");

    setJob(id, { progress: 88, message: "Receiving generated image" });
    const first = result.data.data?.[0];
    const image = first?.b64_json ?? first?.b64;
    if (image) {
      setJob(id, { status: "succeeded", progress: 100, message: "Image ready", result: { image, mimeType: "image/png", prompt: input.prompt } });
      return;
    }

    if (first?.url) {
      const imageResponse = await fetch(first.url);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      setJob(id, {
        status: "succeeded",
        progress: 100,
        message: "Image ready",
        result: { image: buffer.toString("base64"), mimeType: imageResponse.headers.get("content-type") ?? "image/png", prompt: input.prompt },
      });
      return;
    }

    throw new Error("Azure did not return an image");
  } catch (error) {
    setJob(id, { status: "failed", progress: 100, message: "Generation failed", error: error instanceof Error ? error.message : "Image generation failed" });
  }
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

function buildPrompt(settings: PromptSettings, styleCount: number, characterCount: number) {
  const sections = [
    section("Scene", settings.scene),
    section("Subject", settings.subject),
    section("Important details", settings.importantDetails),
    section("Use case", settings.useCase),
    section("Constraints", settings.constraints),
    section("User freeform prompt / extra instructions", settings.prompt),
  ].filter(Boolean) as string[];

  const referenceInstructions: string[] = [];
  if (styleCount > 0 && characterCount > 0) {
    referenceInstructions.push(
      `Use the ${styleCount} style reference image${styleCount > 1 ? "s" : ""} as the source for the overall style, composition, environment, time of day, lighting, camera angle, pose, layout, and the existing person/subject placement. Replace the person/subject from the style reference with the person/character from the ${characterCount} character reference image${characterCount > 1 ? "s" : ""}. Preserve the character reference identity, face, hair, body proportions, outfit cues, and recognizable details while matching the style reference scene and composition. Do not keep the original person identity from the style image.`
    );
  } else if (styleCount > 0) {
    referenceInstructions.push(
      `Use the ${styleCount} style reference image${styleCount > 1 ? "s" : ""} as the primary guide for visual style, composition, environment, lighting, color palette, pose, layout, and the person/subject in the image unless the other instructions say otherwise.`
    );
  } else if (characterCount > 0) {
    referenceInstructions.push(
      `Use the ${characterCount} character reference image${characterCount > 1 ? "s" : ""} to preserve identity, face, hair, body proportions, wardrobe cues, and recognizable subject details.`
    );
  }
  if (referenceInstructions.length > 0) sections.push(section("Reference-image instructions", referenceInstructions.join(" "))!);

  const format = [settings.aspectRatio ? `Format: ${settings.aspectRatio}.` : "", settings.quality ? `Quality/detail target: ${settings.quality}.` : ""].filter(Boolean).join(" ");
  if (format) sections.push(section("Aspect ratio and quality instructions", format)!);

  return sections.join("\n\n");
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

async function callAzureGenerations(prompt: string, size: string) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-image-2";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview";

  if (!endpoint || !apiKey) return { error: "Azure image generation is not configured", status: 500 } as const;

  const response = await fetch(`${endpoint}/openai/deployments/${deployment}/images/generations?api-version=${apiVersion}`, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, n: 1, size, output_format: "png" }),
  });

  const data = (await response.json()) as AzureImageResponse;
  if (!response.ok) return { error: data.error?.message ?? "Azure image generation failed", status: response.status } as const;
  return { data } as const;
}

async function callAzureEdits(prompt: string, files: StoredImage[], size: string) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-image-2";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview";

  if (!endpoint || !apiKey) return { error: "Azure image generation is not configured", status: 500 } as const;

  const body = new FormData();
  body.set("prompt", prompt);
  body.set("n", "1");
  body.set("size", size);
  body.set("output_format", "png");
  files.forEach((file) => body.append("image[]", new Blob([file.bytes], { type: file.type }), file.name));

  const response = await fetch(`${endpoint}/openai/deployments/${deployment}/images/edits?api-version=${apiVersion}`, {
    method: "POST",
    headers: { "api-key": apiKey },
    body,
  });

  const data = (await response.json()) as AzureImageResponse;
  if (!response.ok) return { error: data.error?.message ?? "Azure referenced image generation failed", status: response.status } as const;
  return { data } as const;
}

function pruneJobs() {
  const cutoff = Date.now() - 30 * 60_000;
  for (const [id, job] of jobs) {
    if (job.updatedAt < cutoff) jobs.delete(id);
  }
}
