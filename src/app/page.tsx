"use client";

import { ChangeEvent, FormEvent, useState } from "react";

type UploadGroup = "style" | "character";

type PreviewFile = {
  file: File;
  url: string;
  id: string;
};

type GenerateResponse = {
  id: string;
  image: string;
  mimeType: string;
  prompt: string;
};

type JobResponse = {
  id?: string;
  jobId?: string;
  status: "queued" | "running" | "succeeded" | "failed";
  progress: number;
  message: string;
  error?: string;
  result?: Omit<GenerateResponse, "id">;
};

const examples = [
  "Editorial portrait of a founder in a sunlit studio, cinematic realism, 85mm lens",
  "Luxury skincare bottle on wet stone, soft reflections, premium campaign lighting",
  "Professional adult fashion editorial in pearl-white fabric, Paris street at blue hour, non-explicit brand campaign styling",
];

const aspectRatioOptions = [
  "Square 1:1 — Instagram post, profile, marketplace",
  "Portrait 4:5 — Instagram feed, product editorial",
  "Story/Reel 9:16 — Instagram, TikTok, YouTube Shorts",
  "Landscape 16:9 — YouTube thumbnail, website hero",
  "Classic 3:2 — editorial photo, print crop",
  "Poster 2:3 — vertical poster, Pinterest",
  "Banner 3:1 — website masthead, LinkedIn cover",
  "Wide 21:9 — cinematic frame, hero visual",
  "LinkedIn 1.91:1 — sponsored post",
  "Facebook 1.91:1 — shared link/ad",
  "X/Twitter 16:9 — feed image",
  "Pinterest 2:3 — pin graphic",
];

const qualityOptions = ["1K — fast draft", "2K — detailed social", "4K — premium high detail"];

const safetyModeOptions = [
  "Safe Fashion — recommended, fewer blocks",
  "Conservative Catalog — safest, less creative",
  "Creative Editorial — more freedom, may block",
];

const sceneOptions = [
  "Studio, softbox lighting, seamless backdrop",
  "Golden hour outdoor environment",
  "Night city street with neon reflections",
  "Luxury interior, warm ambient light",
  "Minimal white product set",
  "Editorial fashion set",
  "Office or workspace environment",
  "Cafe / lifestyle setting",
  "Nature landscape background",
  "Futuristic sci-fi environment",
  "Cinematic moody room",
  "Clean UI/device mockup setting",
];

const subjectOptions = [
  "Single person portrait",
  "Full-body fashion subject",
  "Product hero object",
  "Person holding product",
  "Beauty / skincare subject",
  "Food or beverage item",
  "Tech device or app screen",
  "Luxury packaging",
  "Architectural space",
  "Vehicle / mobility subject",
  "Infographic focal object",
  "Abstract concept visual",
];

const detailOptions = [
  "Natural skin texture, realistic fabric, soft shadows",
  "Premium materials, glossy reflections, crisp edges",
  "Dramatic rim light, shallow depth of field, 85mm lens feel",
  "Wide-angle composition, environmental context, dynamic pose",
  "Macro detail, tactile texture, high contrast lighting",
  "Pastel palette, airy mood, clean negative space",
  "Bold color grade, professional high-fashion styling, editorial crop",
  "Photorealistic render, ray-traced reflections, studio polish",
  "Handcrafted texture, paper grain, organic imperfections",
  "Clean typography-safe composition with room for copy",
  "Top-down flat lay, arranged props, balanced composition",
  "Low angle hero shot, powerful silhouette, cinematic contrast",
];

const useCaseOptions = [
  "Editorial photo",
  "Product mockup",
  "Poster",
  "Social media ad",
  "Instagram feed post",
  "TikTok/Reel cover",
  "YouTube thumbnail",
  "Website hero",
  "UI screen mockup",
  "Infographic",
  "Concept frame",
  "Pitch deck visual",
  "E-commerce listing",
  "Brand campaign key visual",
];

const constraintOptions = [
  "No watermark, no logos, no extra text",
  "Preserve face and identity",
  "Preserve layout and camera angle",
  "No distorted hands or face",
  "No text unless explicitly requested",
  "Keep background clean and uncluttered",
  "Keep product shape accurate",
  "Use realistic lighting only",
  "Avoid cartoon or illustration style",
  "Maintain premium brand-safe non-explicit look",
  "Leave negative space for headline copy",
  "No duplicate people or extra limbs",
];

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-4 pr-12 text-sm text-white outline-none ring-cyan-300/40 transition focus:ring-4"
      >
        <option value="">Auto / no preference</option>
        {options.map((option) => (
          <option key={option} value={option} className="bg-slate-950 text-white">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

const maxReferenceBytes = 7.5 * 1024 * 1024;

async function compressImageIfNeeded(file: File) {
  if (file.size <= maxReferenceBytes || !file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  let maxDimension = 2200;
  let quality = 0.86;
  let bestFile = file;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) break;
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) break;
    bestFile = new File([blob], file.name.replace(/\.[^.]+$/, "") + "-compressed.jpg", { type: "image/jpeg", lastModified: Date.now() });
    if (bestFile.size <= maxReferenceBytes) break;
    quality -= 0.08;
    maxDimension = Math.round(maxDimension * 0.82);
  }

  bitmap.close();
  return bestFile;
}

function safetyModeValue(option: string) {
  if (option.startsWith("Conservative")) return "catalog";
  if (option.startsWith("Creative")) return "creative";
  return "safe";
}

function UploadPanel({
  title,
  description,
  files,
  onAdd,
  onRemove,
}: {
  title: string;
  description: string;
  files: PreviewFile[];
  onAdd: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
      </div>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-300/40 bg-cyan-300/[0.04] px-4 py-7 text-center transition hover:border-cyan-200 hover:bg-cyan-300/[0.08]">
        <span className="text-sm font-medium text-cyan-100">Upload one or more images</span>
        <span className="mt-1 text-xs text-slate-400">PNG, JPEG, or WebP. Large images are compressed automatically.</span>
        <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={onAdd} />
      </label>
      {files.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {files.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <img src={item.url} alt="Reference preview" className="aspect-square h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState(aspectRatioOptions[2]);
  const [quality, setQuality] = useState(qualityOptions[0]);
  const [safetyMode, setSafetyMode] = useState(safetyModeOptions[0]);
  const [scene, setScene] = useState("");
  const [subject, setSubject] = useState("");
  const [importantDetails, setImportantDetails] = useState("");
  const [useCase, setUseCase] = useState("");
  const [constraints, setConstraints] = useState(constraintOptions[0]);
  const [styleFiles, setStyleFiles] = useState<PreviewFile[]>([]);
  const [characterFiles, setCharacterFiles] = useState<PreviewFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const referenceCount = styleFiles.length + characterFiles.length;
  const promptRequired = styleFiles.length === 0;
  const canGenerate = (prompt.trim().length > 0 || styleFiles.length > 0) && !isGenerating;
  const downloadName = result ? `gptimage-${result.id}.png` : "gptimage.png";

  async function addFiles(group: UploadGroup, event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    const previews = await Promise.all(
      selected.map(async (file) => {
        const compressed = await compressImageIfNeeded(file);
        return {
          file: compressed,
          url: URL.createObjectURL(compressed),
          id: `${compressed.name}-${compressed.lastModified}-${crypto.randomUUID()}`,
        };
      })
    );

    if (group === "style") {
      setStyleFiles((current) => [...current, ...previews]);
    } else {
      setCharacterFiles((current) => [...current, ...previews]);
    }
  }

  function removeFile(group: UploadGroup, id: string) {
    const update = (files: PreviewFile[]) => {
      const removed = files.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return files.filter((item) => item.id !== id);
    };

    if (group === "style") {
      setStyleFiles(update);
    } else {
      setCharacterFiles(update);
    }
  }

  async function pollJob(jobId: string) {
    if (!jobId) throw new Error("Generation job did not start");

    for (let attempt = 0; attempt < 180; attempt += 1) {
      const response = await fetch(`/api/generate/${jobId}`, { cache: "no-store" });
      const data = (await response.json()) as JobResponse;
      if (!response.ok) throw new Error(data.error ?? "Could not check generation progress");

      setProgress(Math.max(8, Math.min(100, data.progress)));
      setStatusMessage(data.message);

      if (data.status === "succeeded" && data.result) {
        setResult({ id: jobId, ...data.result });
        return;
      }
      if (data.status === "failed") throw new Error(data.error ?? "Image generation failed");

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    throw new Error("Generation is taking longer than expected. Please try again.");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canGenerate) return;

    setIsGenerating(true);
    setProgress(0);
    setStatusMessage("Starting generation");
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.set("prompt", prompt.trim());
    formData.set("aspectRatio", aspectRatio);
    formData.set("quality", quality);
    formData.set("safetyMode", safetyModeValue(safetyMode));
    formData.set("scene", scene);
    formData.set("subject", subject);
    formData.set("importantDetails", importantDetails);
    formData.set("useCase", useCase);
    formData.set("constraints", constraints);
    styleFiles.forEach(({ file }) => formData.append("styleImages", file));
    characterFiles.forEach(({ file }) => formData.append("characterImages", file));

    try {
      setProgress(5);
      setStatusMessage("Uploading request");
      const response = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Image generation failed");
      }
      await pollJob(data.jobId);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Image generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.22),transparent_28%),radial-gradient(circle_at_85%_5%,rgba(168,85,247,0.26),transparent_28%),radial-gradient(circle_at_50%_90%,rgba(20,184,166,0.18),transparent_30%)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10 lg:px-8">
        <header className="flex items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/[0.06] px-6 py-5 shadow-2xl shadow-black/30 backdrop-blur md:px-8">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-xl font-black text-slate-950 shadow-lg shadow-cyan-950/30">
              <span className="absolute inset-0 animate-ping rounded-2xl bg-cyan-300/30" />
              <span className="relative">AI</span>
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-200">Pixilens</p>
              <h1 className="animated-logo-text pb-2 text-3xl font-black leading-[1.18] tracking-tight md:text-5xl">GPT-2 Image Creator</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/imagesearch" className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/40 hover:text-white">
              Image search
            </a>
            <div className="hidden h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-cyan-300 via-fuchsia-300 to-violet-400 blur-sm md:block" />
          </div>
        </header>

        <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="prompt" className="text-xl font-semibold text-white">
                Image prompt
              </label>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
                {promptRequired ? "Required without style reference" : "Optional with style reference"}
              </span>
            </div>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={promptRequired ? "Describe subject, setting, camera, lighting, styling, mood, brand details..." : "Optional: add changes or extra direction. Style reference can drive the image."}
              className="mt-4 min-h-40 w-full resize-none rounded-3xl border border-white/10 bg-black/30 p-5 text-lg leading-8 text-white outline-none ring-cyan-300/40 transition placeholder:text-slate-500 focus:ring-4"
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <SelectField label="Social format / aspect ratio" value={aspectRatio} options={aspectRatioOptions} onChange={setAspectRatio} />
              <SelectField label="Quality" value={quality} options={qualityOptions} onChange={setQuality} />
              <SelectField label="Fashion safety mode" value={safetyMode} options={safetyModeOptions} onChange={setSafetyMode} />
              <SelectField label="Scene" value={scene} options={sceneOptions} onChange={setScene} />
              <SelectField label="Subject" value={subject} options={subjectOptions} onChange={setSubject} />
              <SelectField label="Important details" value={importantDetails} options={detailOptions} onChange={setImportantDetails} />
              <SelectField label="Use case" value={useCase} options={useCaseOptions} onChange={setUseCase} />
              <div className="md:col-span-2">
                <SelectField label="Constraints" value={constraints} options={constraintOptions} onChange={setConstraints} />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {examples.map((example) => (
                <button
                  type="button"
                  key={example}
                  onClick={() => setPrompt(example)}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-left text-xs text-slate-300 transition hover:border-cyan-200/40 hover:text-white"
                >
                  {example}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={!canGenerate}
              className="mt-8 flex w-full items-center justify-center rounded-2xl bg-cyan-300 px-6 py-4 text-base font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              <span className={isGenerating ? "mr-3 h-5 w-5 animate-spin rounded-full border-2 border-slate-950/20 border-t-slate-950" : "hidden"} />
              {isGenerating ? "Generating image..." : `Generate image${referenceCount ? ` with ${referenceCount} reference${referenceCount > 1 ? "s" : ""}` : ""}`}
            </button>
            {isGenerating ? (
              <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-cyan-100">
                  <span>{statusMessage || "Working"}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-300 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : null}
            {error ? <p className="mt-4 rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">{error}</p> : null}
          </section>

          <section className="grid gap-6">
            <UploadPanel
              title="Style references"
              description="Use these as visual direction for pose, scene, lighting, setting, garment styling, camera, and composition in a new original image."
              files={styleFiles}
              onAdd={(event) => addFiles("style", event)}
              onRemove={(id) => removeFile("style", id)}
            />
            <UploadPanel
              title="Character references"
              description="Use these for identity, hairstyle, complexion, general silhouette, posture, and styling continuity in a professional non-explicit image."
              files={characterFiles}
              onAdd={(event) => addFiles("character", event)}
              onRemove={(id) => removeFile("character", id)}
            />
          </section>
        </form>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-white">Generated result</h2>
              <p className="mt-2 text-sm text-slate-400">Outputs are returned to this browser session only.</p>
            </div>
            {result ? (
              <a
                href={`data:${result.mimeType};base64,${result.image}`}
                download={downloadName}
                className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-100"
              >
                Download image
              </a>
            ) : null}
          </div>
          <div className="mt-6 flex min-h-[28rem] items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30">
            {result ? (
              <img src={`data:${result.mimeType};base64,${result.image}`} alt={result.prompt} className="max-h-[70vh] w-full object-contain" />
            ) : isGenerating ? (
              <div className="flex max-w-md flex-col items-center px-6 text-center text-slate-300">
                <div className="mb-5 h-14 w-14 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-200" />
                <p className="text-lg font-semibold text-white">Generating your image</p>
                <p className="mt-2 text-sm text-slate-400">{statusMessage || "This can take up to a minute for reference images."}</p>
                <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-300 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <div className="max-w-md px-6 text-center text-slate-400">
                Your generated image will appear here. Add a prompt and optional references to begin.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
