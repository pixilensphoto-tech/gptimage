import Link from "next/link";

const features = [
  {
    href: "/gpt2",
    title: "GPT Image Creator 2",
    description: "Generate fashion and editorial images with text prompts and style references using Azure OpenAI GPT Image 2.",
    icon: "AI",
    color: "cyan",
    gradient: "from-cyan-300 to-cyan-400",
    borderColor: "border-cyan-300/40",
    textColor: "text-cyan-100",
    bgColor: "bg-cyan-300/10",
    accentColor: "hover:border-cyan-200/60",
  },
  {
    href: "/codex",
    title: "Codex Generator",
    description: "Create images with identity, outfit, pose, and background references. Includes bypass option for virtual try-on.",
    icon: "CX",
    color: "violet",
    gradient: "from-violet-300 to-violet-400",
    borderColor: "border-violet-300/40",
    textColor: "text-violet-100",
    bgColor: "bg-violet-300/10",
    accentColor: "hover:border-violet-200/60",
  },
  {
    href: "/outfitchange",
    title: "Virtual Outfit Change",
    description: "Swap garments onto your model using the RunningHub try-on pipeline. Upload a model photo and a garment to try on.",
    icon: "OC",
    color: "fuchsia",
    gradient: "from-fuchsia-300 to-fuchsia-400",
    borderColor: "border-fuchsia-300/40",
    textColor: "text-fuchsia-100",
    bgColor: "bg-fuchsia-300/10",
    accentColor: "hover:border-fuchsia-200/60",
  },
  {
    href: "/images",
    title: "Images Gallery",
    description: "Track pending, completed, and failed generations across Codex, try-on, and the shared image pipelines.",
    icon: "IM",
    color: "teal",
    gradient: "from-teal-300 to-teal-400",
    borderColor: "border-teal-300/40",
    textColor: "text-teal-100",
    bgColor: "bg-teal-300/10",
    accentColor: "hover:border-teal-200/60",
  },
];

const colorMap: Record<string, { gradient: string; border: string; text: string; bg: string; accent: string; btnText: string; btnHover: string }> = {
  cyan: { gradient: "from-cyan-300 to-cyan-400", border: "border-cyan-300/40", text: "text-cyan-100", bg: "bg-cyan-300/10", accent: "hover:border-cyan-200/60", btnText: "text-slate-950", btnHover: "hover:bg-cyan-200" },
  violet: { gradient: "from-violet-300 to-violet-400", border: "border-violet-300/40", text: "text-violet-100", bg: "bg-violet-300/10", accent: "hover:border-violet-200/60", btnText: "text-slate-950", btnHover: "hover:bg-violet-200" },
  fuchsia: { gradient: "from-fuchsia-300 to-fuchsia-400", border: "border-fuchsia-300/40", text: "text-fuchsia-100", bg: "bg-fuchsia-300/10", accent: "hover:border-fuchsia-200/60", btnText: "text-slate-950", btnHover: "hover:bg-fuchsia-200" },
  teal: { gradient: "from-teal-300 to-teal-400", border: "border-teal-300/40", text: "text-teal-100", bg: "bg-teal-300/10", accent: "hover:border-teal-200/60", btnText: "text-slate-950", btnHover: "hover:bg-teal-200" },
};

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_85%_5%,rgba(168,85,247,0.22),transparent_28%),radial-gradient(circle_at_50%_90%,rgba(20,184,166,0.16),transparent_30%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 lg:px-8">
        <header className="flex flex-col items-center gap-5 rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl shadow-black/30 backdrop-blur">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-violet-300 to-fuchsia-300 text-2xl font-black text-slate-950 shadow-lg shadow-black/20">
            <span className="absolute inset-0 animate-ping rounded-2xl bg-cyan-300/30" />
            <span className="relative">PX</span>
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-200">Pixilens</p>
            <h1 className="animated-logo-text pb-2 text-4xl font-black leading-[1.18] tracking-tight md:text-6xl">Image Generation Studio</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-300">
              Multiple AI image generation pipelines — from high-quality fashion editorial to virtual garment try-on.
            </p>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => {
            const c = colorMap[feature.color];
            return (
              <article
                key={feature.href}
                className={`group relative flex flex-col gap-5 rounded-[2rem] border ${c.border} ${c.bg} overflow-hidden p-8 shadow-2xl shadow-black/20 backdrop-blur transition ${c.accent}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${c.gradient} text-xl font-black ${c.btnText} shadow-lg shadow-black/20`}>
                    {feature.icon}
                  </div>
                  <div className={`h-10 w-10 animate-pulse rounded-full bg-gradient-to-br ${c.gradient} blur-sm opacity-60 transition group-hover:opacity-100`} />
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  <h2 className="text-2xl font-bold text-white">{feature.title}</h2>
                  <p className="flex-1 text-sm leading-6 text-slate-300">{feature.description}</p>
                </div>
                <Link
                  href={feature.href}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br ${c.gradient} px-6 py-4 text-base font-bold ${c.btnText} shadow-lg shadow-black/20 transition ${c.accent} ${c.btnHover}`}
                >
                  Open {feature.title.split(" ")[0]}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </article>
            );
          })}
        </section>

        <footer className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center text-sm text-slate-400 backdrop-blur">
          Generation requests create durable gallery records so you can return later and review pending, completed, and failed images.
        </footer>
      </div>
    </main>
  );
}