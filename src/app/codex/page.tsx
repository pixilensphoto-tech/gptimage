"use client";

import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PreviewFile = {
  file: File;
  url: string;
  id: string;
};

type CodexResponse = {
  pipeline: "codex" | "runninghub";
  dimensions?: { width: number; height: number };
  codex?: { notes: string };
  runninghub?: { taskId: string; outputUrl: string; workflowId: string };
  imgbb?: { url: string };
  usedFallback?: boolean;
};

type CodexSubmitResponse = {
  id?: string;
  jobId?: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  progress: number;
  message: string;
  error?: string;
  galleryUrl?: string;
};

type ApiImage = {
  dataUrl: string;
};

const qualityOptions = ["1K", "2K", "4K"];

const aspectRatioOptions = [
  "9:16",
  "16:9",
  "1:1",
  "4:3",
  "3:4",
  "4:5",
  "5:4",
];

const categoryOptions = [
  "Fashion Editorial",
  "Product Campaign",
  "Street Style",
  "Luxury Branding",
  "Beauty & Skincare",
  "E-commerce Listing",
  "Social Media Ad",
  "Brand Story",
  "Catalog Photography",
];

const sceneOptions = [
  "Urban street",
  "Studio backdrop",
  "Natural outdoor",
  "Interior setting",
  "Abstract environment",
  "Night atmosphere",
  "Golden hour",
  "Minimal clean",
];

const styleOptions = [
  "Cinematic realism",
  "High fashion editorial",
  "Commercial catalog",
  "Street photography",
  "Minimalist luxury",
  "Bold color grade",
  "Black and white",
  "Soft natural light",
];

const compositionOptions = [
  "Full body shot",
  "Portrait focus",
  "Three-quarter angle",
  "Close crop",
  "Environmental context",
  "Product hero",
  "Flat lay style",
  "Over-the-shoulder",
];

const materialsOptions = [
  "Natural fabrics: cotton, linen, silk",
  "Premium materials: leather, wool, cashmere",
  "Tech fabrics: polyester blends, performance wear",
  "Luxury textures: velvet, satin, lace accents",
  "Everyday wear: denim, casual knits",
  "Formal fabrics: tailored wool, suitings",
];

const constraintOptions = [
  "No watermark or text",
  "Preserve face and identity",
  "Maintain original lighting",
  "No distorted anatomy",
  "Keep background clean",
  "Professional retouching",
  "Brand-safe styling",
  "Editorial quality output",
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
        <option value="">Auto / none</option>
        {options.map((option) => (
          <option key={option} value={option} className="bg-slate-950 text-white">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function UploadPanel({
  title,
  description,
  files,
  onAdd,
  onRemove,
  maxFiles = 4,
}: {
  title: string;
  description: string;
  files: PreviewFile[];
  onAdd: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
  maxFiles?: number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
      </div>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-300/40 bg-cyan-300/[0.04] px-4 py-7 text-center transition hover:border-cyan-200 hover:bg-cyan-300/[0.08]">
        <span className="text-sm font-medium text-cyan-100">Upload image{files.length > 0 ? ` (${files.length}/${maxFiles})` : ""}</span>
        <span className="mt-1 text-xs text-slate-400">PNG, JPEG, or WebP</span>
        <input
          className="sr-only"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple={maxFiles > 1}
          onChange={onAdd}
          disabled={files.length >= maxFiles}
        />
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

export default function CodexPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [identityFiles, setIdentityFiles] = useState<PreviewFile[]>([]);
  const [outfitFile, setOutfitFile] = useState<PreviewFile | null>(null);
  const [poseFile, setPoseFile] = useState<PreviewFile | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<PreviewFile | null>(null);
  const [bypassOutfit, setBypassOutfit] = useState(false);
  const [quality, setQuality] = useState(qualityOptions[1]);
  const [aspectRatio, setAspectRatio] = useState(aspectRatioOptions[0]);
  const [category, setCategory] = useState("");
  const [scene, setScene] = useState("");
  const [style, setStyle] = useState("");
  const [composition, setComposition] = useState("");
  const [materials, setMaterials] = useState("");
  const [constraints, setConstraints] = useState(constraintOptions[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CodexResponse | null>(null);

  const canGenerate = (prompt.trim().length > 0 || identityFiles.length > 0) && !isGenerating;

  function addFiles(files: PreviewFile[], newFiles: PreviewFile[], max: number) {
    const combined = [...files, ...newFiles];
    return combined.slice(0, max);
  }

  async function handleIdentityAdd(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    const previews = await Promise.all(
      selected.map(async (file) => ({
        file,
        url: URL.createObjectURL(file),
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      }))
    );
    setIdentityFiles((current) => addFiles(current, previews, 4));
  }

  async function handleSingleAdd(
    setter: Dispatch<SetStateAction<PreviewFile | null>>,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (selected) {
      setter({
        file: selected,
        url: URL.createObjectURL(selected),
        id: `${selected.name}-${selected.lastModified}-${crypto.randomUUID()}`,
      });
    }
  }

  function removeFile(setter: Dispatch<SetStateAction<PreviewFile | null>>, id: string) {
    setter((current) => {
      if (current?.id === id) {
        URL.revokeObjectURL(current.url);
        return null;
      }
      return current;
    });
  }

  function removeIdentity(id: string) {
    setIdentityFiles((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((item) => item.id !== id);
    });
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function toApiImage(dataUrl: string): ApiImage {
    return { dataUrl };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canGenerate) return;

    setIsGenerating(true);
    setProgress(0);
    setStatusMessage("Starting generation");
    setError(null);
    setResult(null);

    try {
      setProgress(10);
      setStatusMessage("Preparing images");

      const identityDataUrls = await Promise.all(identityFiles.map((f) => fileToBase64(f.file)));
      const outfitDataUrl = outfitFile ? await fileToBase64(outfitFile.file) : undefined;
      const poseDataUrl = poseFile ? await fileToBase64(poseFile.file) : undefined;
      const backgroundDataUrl = backgroundFile ? await fileToBase64(backgroundFile.file) : undefined;

      const payload: Record<string, unknown> = {
        quality,
        aspectRatio,
        bypassCodex: bypassOutfit,
      };

      if (prompt.trim()) payload.prompt = prompt.trim();
      if (identityDataUrls.length > 0) payload.identityImages = identityDataUrls.map(toApiImage);
      if (outfitDataUrl) payload.outfitImage = toApiImage(outfitDataUrl);
      if (poseDataUrl) payload.poseImage = toApiImage(poseDataUrl);
      if (backgroundDataUrl) payload.backgroundImage = toApiImage(backgroundDataUrl);
      if (category) payload.category = category;
      if (scene) payload.scene = scene;
      if (style) payload.style = style;
      if (composition) payload.composition = composition;
      if (materials) payload.materials = materials;
      if (constraints) payload.constraints = constraints;

      setProgress(30);
      setStatusMessage("Submitting generation job");

      const response = await fetch("/api/codex/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as CodexSubmitResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Codex generation failed");
      }

      setProgress(100);
      setStatusMessage(data.message || "Generation started");
      router.push(data.galleryUrl ?? "/images");
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
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-300 text-xl font-black text-slate-950 shadow-lg shadow-violet-950/30">
              <span className="absolute inset-0 animate-ping rounded-2xl bg-violet-300/30" />
              <span className="relative">CX</span>
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-200">Pixilens</p>
              <h1 className="animated-logo-text pb-2 text-3xl font-black leading-[1.18] tracking-tight md:text-5xl">Codex Image Generator</h1>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/gpt2" className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/40 hover:text-white">
              GPT-2
            </Link>
            <Link href="/outfitchange" className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/40 hover:text-white">
              Outfit Change
            </Link>
            <Link href="/images" className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/40 hover:text-white">
              Images
            </Link>
            <div className="hidden h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-300 to-cyan-400 blur-sm md:block" />
          </nav>
        </header>

        <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <label htmlFor="prompt" className="text-xl font-semibold text-white">
                Image prompt
              </label>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
                {identityFiles.length > 0 ? "Optional with identity" : "Required without identity"}
              </span>
            </div>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the image you want to create..."
              className="mt-4 min-h-32 w-full resize-none rounded-3xl border border-white/10 bg-black/30 p-5 text-lg leading-8 text-white outline-none ring-cyan-300/40 transition placeholder:text-slate-500 focus:ring-4"
            />

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                "Professional fashion editorial, softbox lighting",
                "Luxury brand campaign, outdoor setting",
                "Street style photography, urban backdrop",
              ].map((example) => (
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

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <SelectField label="Quality" value={quality} options={qualityOptions} onChange={setQuality} />
              <SelectField label="Aspect Ratio" value={aspectRatio} options={aspectRatioOptions} onChange={setAspectRatio} />
              <SelectField label="Category" value={category} options={categoryOptions} onChange={setCategory} />
              <SelectField label="Scene" value={scene} options={sceneOptions} onChange={setScene} />
              <SelectField label="Style" value={style} options={styleOptions} onChange={setStyle} />
              <SelectField label="Composition" value={composition} options={compositionOptions} onChange={setComposition} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SelectField label="Materials" value={materials} options={materialsOptions} onChange={setMaterials} />
              <SelectField label="Constraints" value={constraints} options={constraintOptions} onChange={setConstraints} />
            </div>

            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <input
                type="checkbox"
                checked={bypassOutfit}
                onChange={(event) => setBypassOutfit(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-black/40 text-violet-300"
              />
              <span>
                <span className="block text-sm font-semibold text-white">Run Codex, then try-on</span>
                <span className="mt-1 block text-xs text-slate-400">Generate with Codex first, then automatically run the RunningHub try-on pipeline. Requires identity image and outfit image.</span>
              </span>
            </label>

            <button
              type="submit"
              disabled={!canGenerate}
              className="mt-8 flex w-full items-center justify-center rounded-2xl bg-violet-300 px-6 py-4 text-base font-bold text-slate-950 shadow-lg shadow-violet-950/30 transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              <span className={isGenerating ? "mr-3 h-5 w-5 animate-spin rounded-full border-2 border-slate-950/20 border-t-slate-950" : "hidden"} />
              {isGenerating ? "Generating..." : "Generate with Codex"}
            </button>

            {isGenerating ? (
              <div className="mt-5 rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-violet-100">
                  <span>{statusMessage || "Working"}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-violet-300 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : null}
            {error ? <p className="mt-4 rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">{error}</p> : null}
          </section>

          <section className="grid gap-6">
            <UploadPanel
              title="Identity Images"
              description="1-4 face/body reference images. All formats accepted."
              files={identityFiles}
              onAdd={handleIdentityAdd}
              onRemove={removeIdentity}
              maxFiles={4}
            />
            <UploadPanel
              title="Outfit Reference"
              description="Exact garment to feature in the image."
              files={outfitFile ? [outfitFile] : []}
              onAdd={(e) => handleSingleAdd(setOutfitFile, e)}
              onRemove={(id) => removeFile(setOutfitFile, id)}
              maxFiles={1}
            />
            <UploadPanel
              title="Pose Reference"
              description="Pose and framing reference."
              files={poseFile ? [poseFile] : []}
              onAdd={(e) => handleSingleAdd(setPoseFile, e)}
              onRemove={(id) => removeFile(setPoseFile, id)}
              maxFiles={1}
            />
            <UploadPanel
              title="Background Reference"
              description="Backdrop and environment reference."
              files={backgroundFile ? [backgroundFile] : []}
              onAdd={(e) => handleSingleAdd(setBackgroundFile, e)}
              onRemove={(id) => removeFile(setBackgroundFile, id)}
              maxFiles={1}
            />
          </section>
        </form>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-white">Generated result</h2>
              <p className="mt-2 text-sm text-slate-400">
                {result?.pipeline === "runninghub" ? "RunningHub try-on pipeline (90-120s)" : "Codex AI generation pipeline"}
              </p>
            </div>
            {result?.imgbb?.url ? (
              <a
                href={result.imgbb.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-violet-100"
              >
                Open image
              </a>
            ) : null}
          </div>
          <div className="mt-6 flex min-h-[28rem] items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30">
            {result?.imgbb?.url ? (
              <img src={result.imgbb.url} alt="Generated" className="max-h-[70vh] w-full object-contain" />
            ) : isGenerating ? (
              <div className="flex max-w-md flex-col items-center px-6 text-center text-slate-300">
                <div className="mb-5 h-14 w-14 animate-spin rounded-full border-4 border-violet-300/20 border-t-violet-200" />
                <p className="text-lg font-semibold text-white">Generating your image</p>
                <p className="mt-2 text-sm text-slate-400">{statusMessage || "This may take a few moments..."}</p>
                <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-violet-300 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <div className="max-w-md px-6 text-center text-slate-400">
                Your generated image will appear here. Add a prompt and identity reference to begin.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
