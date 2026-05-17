import Link from "next/link";
import { listGalleryItems, type GalleryItem } from "@/lib/galleryDb";

export const dynamic = "force-dynamic";

const statusTheme = {
  pending: {
    pill: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    ring: "border-amber-300/20",
    dot: "bg-amber-300",
  },
  processing: {
    pill: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
    ring: "border-cyan-300/20",
    dot: "bg-cyan-300",
  },
  succeeded: {
    pill: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
    ring: "border-emerald-300/20",
    dot: "bg-emerald-300",
  },
  failed: {
    pill: "border-red-300/30 bg-red-300/10 text-red-100",
    ring: "border-red-300/20",
    dot: "bg-red-300",
  },
} as const;

function formatGenerator(generator: string) {
  return generator.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ImagesPage() {
  const items = await listGalleryItems(120);

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(56,189,248,0.2),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(217,70,239,0.24),transparent_25%),radial-gradient(circle_at_50%_95%,rgba(20,184,166,0.16),transparent_30%)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-200">Pixilens</p>
            <h1 className="animated-logo-text pb-2 text-3xl font-black leading-[1.18] tracking-tight md:text-5xl">Images</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Browse pending, completed, and failed image generations across Codex, try-on, and the shared pipelines.</p>
          </div>
          <nav className="flex flex-wrap gap-3">
            <Link href="/" className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/40 hover:text-white">
              Home
            </Link>
            <Link href="/gpt2" className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/40 hover:text-white">
              GPT-2
            </Link>
            <Link href="/codex" className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/40 hover:text-white">
              Codex
            </Link>
            <Link href="/outfitchange" className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/40 hover:text-white">
              Outfit Change
            </Link>
          </nav>
        </header>

        {items.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-10 text-center text-slate-400">
            No generated images yet. Start a Codex or try-on request and the placeholder will appear here.
          </div>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item: GalleryItem) => {
              const theme = statusTheme[item.status];
              const imageUrl = item.imageUrl;
              const prompt = item.prompt?.trim();

              return (
                <article key={item.id} className={`overflow-hidden rounded-3xl border ${theme.ring} bg-white/[0.07] shadow-2xl shadow-black/20 backdrop-blur`}>
                  <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-black/30">
                    {imageUrl ? (
                      <a href={imageUrl} target="_blank" rel="noreferrer" className="block h-full w-full">
                        <img src={imageUrl} alt={prompt || `${formatGenerator(item.generator)} result`} className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]" loading="lazy" referrerPolicy="no-referrer" />
                      </a>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center text-slate-300">
                        <div className={`mb-4 h-12 w-12 rounded-full ${theme.dot} ${item.status === "processing" ? "animate-pulse" : ""} opacity-80`} />
                        <p className="text-base font-semibold text-white">{item.message || "Waiting for update"}</p>
                        <p className="mt-2 text-xs text-slate-400">Placeholder created at {formatDate(item.createdAt)}</p>
                      </div>
                    )}
                    <div className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur ${theme.pill}`}>
                      {item.status}
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-200">{formatGenerator(item.generator)}</span>
                      <span>{item.progress}%</span>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-white">{prompt || item.message || "Generated image"}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDate(item.updatedAt)}</p>
                    </div>

                    {item.aspectRatio ? <p className="text-xs text-slate-300">Aspect ratio: {item.aspectRatio}</p> : null}
                    {item.error ? <p className="rounded-2xl bg-red-500/10 p-3 text-xs text-red-200">{item.error}</p> : null}

                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-white/80 transition-all duration-500" style={{ width: `${item.progress}%` }} />
                    </div>

                    {imageUrl ? (
                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                        <a href={imageUrl} target="_blank" rel="noreferrer" className="rounded-full bg-cyan-300 px-3 py-2 text-center text-slate-950 hover:bg-cyan-200">
                          Open image
                        </a>
                        <a href={imageUrl} download className="rounded-full border border-white/10 px-3 py-2 text-center text-slate-200 hover:border-cyan-200/40 hover:text-white">
                          Download
                        </a>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
