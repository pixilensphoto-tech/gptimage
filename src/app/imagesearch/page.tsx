"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ImageResult = {
  title: string;
  thumbnail: string;
  imageUrl: string;
  sourceUrl: string;
};

export default function ImageSearchPage() {
  const [query, setQuery] = useState("fashion editorial pose reference");
  const [results, setResults] = useState<ImageResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setCopiedUrl(null);

    try {
      const response = await fetch(`/api/imagesearch?q=${encodeURIComponent(trimmed)}&count=30`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Image search failed");
      setResults(data.results ?? []);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Image search failed");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(56,189,248,0.2),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(217,70,239,0.24),transparent_25%),radial-gradient(circle_at_50%_95%,rgba(20,184,166,0.16),transparent_30%)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-200">Pixilens</p>
            <h1 className="animated-logo-text pb-2 text-3xl font-black leading-[1.18] tracking-tight md:text-5xl">Image Search</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Search public image results and collect visual references for pose, styling, lighting, and scene direction.</p>
          </div>
          <Link href="/" className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/40 hover:text-white">
            Back to creator
          </Link>
        </header>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
          <form onSubmit={onSubmit} className="flex flex-col gap-4 md:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search images, e.g. fashion editorial red dress studio pose"
              className="min-h-14 flex-1 rounded-2xl border border-white/10 bg-black/30 px-5 text-base text-white outline-none ring-cyan-300/40 transition placeholder:text-slate-500 focus:ring-4"
            />
            <button
              type="submit"
              disabled={isLoading || query.trim().length < 2}
              className="rounded-2xl bg-cyan-300 px-8 py-4 font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              {isLoading ? "Searching..." : "Search images"}
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-400">Google scraping is unofficial and may occasionally fail if markup changes or requests are blocked.</p>
          {error ? <p className="mt-4 rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">{error}</p> : null}
        </section>

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.05]">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-200" />
          </div>
        ) : null}

        {!isLoading && results.length > 0 ? (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((result) => (
              <article key={result.imageUrl} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] shadow-2xl shadow-black/20 backdrop-blur">
                <a href={result.imageUrl} target="_blank" rel="noreferrer" className="block bg-black/30">
                  <img src={result.thumbnail} alt={result.title} className="aspect-[4/5] w-full object-cover transition duration-300 hover:scale-[1.03]" loading="lazy" referrerPolicy="no-referrer" />
                </a>
                <div className="space-y-3 p-4">
                  <p className="truncate text-sm font-medium text-slate-200">{result.title}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <a href={result.imageUrl} target="_blank" rel="noreferrer" className="rounded-full bg-cyan-300 px-3 py-2 text-center text-slate-950 hover:bg-cyan-200">
                      Open image
                    </a>
                    <a href={result.sourceUrl} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-2 text-center text-slate-200 hover:border-cyan-200/40 hover:text-white">
                      Source
                    </a>
                    <button type="button" onClick={() => copyUrl(result.imageUrl)} className="col-span-2 rounded-full border border-white/10 px-3 py-2 text-slate-200 hover:border-cyan-200/40 hover:text-white">
                      {copiedUrl === result.imageUrl ? "Copied" : "Copy image URL"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {!isLoading && !error && results.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-10 text-center text-slate-400">Search for an image reference to begin.</div>
        ) : null}
      </div>
    </main>
  );
}
