"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PreviewFile = {
  file: File;
  url: string;
  id: string;
};

type TryOnSubmitResponse = {
  id?: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  progress: number;
  message: string;
  error?: string;
  galleryUrl?: string;
};

const aspectRatioOptions = ["9:16", "16:9", "1:1", "4:3", "3:4", "4:5", "5:4"];

type ApiImage = {
  dataUrl: string;
};

export default function OutfitChangePage() {
  const router = useRouter();
  const [identityFile, setIdentityFile] = useState<PreviewFile | null>(null);
  const [outfitFile, setOutfitFile] = useState<PreviewFile | null>(null);
  const [aspectRatio, setAspectRatio] = useState(aspectRatioOptions[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canGenerate = identityFile !== null && outfitFile !== null && !isGenerating;

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }
    });
  }

  async function handleSingleAdd(
    setter: React.Dispatch<React.SetStateAction<PreviewFile | null>>,
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

  function removeFile(setter: React.Dispatch<React.SetStateAction<PreviewFile | null>>) {
    setter((current) => {
      if (current) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canGenerate) return;

    setIsGenerating(true);
    setProgress(0);
    setStatusMessage("Preparing images");
    setError(null);

    try {
      setProgress(15);
      setStatusMessage("Converting images");

      const identityDataUrl = await fileToBase64(identityFile!.file);
      const outfitDataUrl = await fileToBase64(outfitFile!.file);

      setProgress(30);
      setStatusMessage("Sending try-on request");

      const payload = {
        modelImage: { dataUrl: identityDataUrl } satisfies ApiImage,
        outfitImage: { dataUrl: outfitDataUrl } satisfies ApiImage,
        aspectRatio,
      };

      const response = await fetch("/api/codex/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as TryOnSubmitResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Try-on generation failed");
      }

      setProgress(100);
      setStatusMessage(data.message || "Try-on started");
      router.push(data.galleryUrl ?? "/images");
      setIsGenerating(false);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Try-on generation failed");
      setIsGenerating(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(168,85,247,0.22),transparent_28%),radial-gradient(circle_at_85%_5%,rgba(56,189,248,0.26),transparent_28%),radial-gradient(circle_at_50%_90%,rgba(20,184,166,0.18),transparent_30%)]" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10 lg:px-8">
        <header className="flex items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/[0.06] px-6 py-5 shadow-2xl shadow-black/30 backdrop-blur md:px-8">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-300 text-xl font-black text-slate-950 shadow-lg shadow-fuchsia-950/30">
              <span className="absolute inset-0 animate-ping rounded-2xl bg-fuchsia-300/30" />
              <span className="relative">OC</span>
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-fuchsia-200">Pixilens</p>
              <h1 className="animated-logo-text pb-2 text-3xl font-black leading-[1.18] tracking-tight md:text-5xl">Virtual Outfit Change</h1>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/gpt2" className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/40 hover:text-white">
              GPT-2
            </Link>
            <Link href="/codex" className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/40 hover:text-white">
              Codex
            </Link>
            <Link href="/images" className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/40 hover:text-white">
              Images
            </Link>
            <div className="hidden h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-fuchsia-300 via-violet-300 to-cyan-400 blur-sm md:block" />
          </nav>
        </header>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/10 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fuchsia-300/20">
              <svg className="h-5 w-5 text-fuchsia-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-fuchsia-100">RunningHub Try-On Pipeline</p>
              <p className="mt-1 text-sm text-slate-300">This uses the virtual try-on endpoint to swap garments onto your model. Takes 90-120 seconds to process.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="grid gap-8 md:grid-cols-2">
            <section className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-white">Model Photo (Identity)</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-300">Your model or subject photo — identity is fully preserved.</p>
                </div>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-fuchsia-300/40 bg-fuchsia-300/[0.04] px-4 py-10 text-center transition hover:border-fuchsia-200 hover:bg-fuchsia-300/[0.08]">
                  {identityFile ? (
                    <div className="relative">
                      <img src={identityFile.url} alt="Identity" className="h-40 w-40 rounded-2xl object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(setIdentityFile)}
                        className="absolute -right-2 -top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-fuchsia-100">Upload model photo</span>
                      <span className="mt-1 text-xs text-slate-400">PNG, JPEG, or WebP</span>
                    </>
                  )}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleSingleAdd(setIdentityFile, e)}
                  />
                </label>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-white">Garment Photo (Outfit)</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-300">The garment you want to swap onto the model.</p>
                </div>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-fuchsia-300/40 bg-fuchsia-300/[0.04] px-4 py-10 text-center transition hover:border-fuchsia-200 hover:bg-fuchsia-300/[0.08]">
                  {outfitFile ? (
                    <div className="relative">
                      <img src={outfitFile.url} alt="Outfit" className="h-40 w-40 rounded-2xl object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(setOutfitFile)}
                        className="absolute -right-2 -top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-fuchsia-100">Upload garment photo</span>
                      <span className="mt-1 text-xs text-slate-400">PNG, JPEG, or WebP</span>
                    </>
                  )}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleSingleAdd(setOutfitFile, e)}
                  />
                </label>
              </div>
            </section>

            <section className="flex flex-col justify-center">
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
                  <label className="mb-5 block text-left">
                    <span className="text-sm font-medium text-slate-200">Aspect Ratio</span>
                    <select
                      value={aspectRatio}
                      onChange={(event) => setAspectRatio(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-4 pr-12 text-sm text-white outline-none ring-fuchsia-300/40 transition focus:ring-4"
                    >
                      {aspectRatioOptions.map((option) => (
                        <option key={option} value={option} className="bg-slate-950 text-white">
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <h3 className="mb-4 text-lg font-semibold text-white">How it works</h3>
                  <ol className="space-y-3 text-left text-sm text-slate-300">
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fuchsia-300/20 text-xs font-bold text-fuchsia-100">1</span>
                      Upload a clear photo of your model
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fuchsia-300/20 text-xs font-bold text-fuchsia-100">2</span>
                      Upload the garment you want to try on
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fuchsia-300/20 text-xs font-bold text-fuchsia-100">3</span>
                      Click &quot;Try On&quot; and check the Images gallery while it processes
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fuchsia-300/20 text-xs font-bold text-fuchsia-100">4</span>
                      Download your virtual try-on result
                    </li>
                  </ol>
                </div>

                <button
                  type="submit"
                  disabled={!canGenerate}
                  className="flex w-full items-center justify-center rounded-2xl bg-fuchsia-300 px-6 py-4 text-base font-bold text-slate-950 shadow-lg shadow-fuchsia-950/30 transition hover:bg-fuchsia-200 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                >
                  <span className={isGenerating ? "mr-3 h-5 w-5 animate-spin rounded-full border-2 border-slate-950/20 border-t-slate-950" : "mr-2"} />
                  {isGenerating ? "Processing..." : "Try On Garment"}
                </button>

                {isGenerating ? (
                  <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/10 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm text-fuchsia-100">
                      <span>{statusMessage || "Working"}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-fuchsia-300 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ) : null}
                {error ? <p className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">{error}</p> : null}
              </div>
            </section>
          </form>
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
          <div className="flex min-h-[20rem] items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30">
            {isGenerating ? (
              <div className="flex max-w-md flex-col items-center px-6 text-center text-slate-300">
                <div className="mb-5 h-14 w-14 animate-spin rounded-full border-4 border-fuchsia-300/20 border-t-fuchsia-200" />
                <p className="text-lg font-semibold text-white">Starting virtual try-on</p>
                <p className="mt-2 text-sm text-slate-400">{statusMessage || "Your request is being added to the Images gallery."}</p>
                <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-fuchsia-300 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <div className="max-w-md px-6 text-center text-slate-400">
                Submit a try-on request and track the placeholder plus final result in the Images gallery.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
