import { upscaleAction } from "./actions";

export const dynamic = "force-dynamic";

export default function UpscalePage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 bg-white/[0.03] p-8 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">Beta</p>
          <h1 className="text-3xl font-black mb-2 animated-logo-text">Direct Upscale</h1>
          <p className="text-slate-400 text-sm">Upload an image to upscale it directly via RunningHub</p>
        </div>

        <form action={upscaleAction} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-widest text-cyan-200/60">Source Image</label>
            <input
              type="file"
              name="file"
              accept="image/*"
              required
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm file:bg-cyan-400 file:border-none file:rounded-full file:px-4 file:py-1 file:mr-4 file:text-xs file:font-bold file:text-black hover:border-cyan-400/30 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black rounded-2xl shadow-lg shadow-cyan-400/20 transition-all active:scale-[0.98]"
          >
            Start Upscale
          </button>
        </form>

        <div className="pt-4 text-center">
          <a href="/images" className="text-xs text-slate-500 hover:text-cyan-200 transition">View Gallery</a>
        </div>
      </div>
    </main>
  );
}
