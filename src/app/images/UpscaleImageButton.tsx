"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type UpscaleImageButtonProps = {
  id: string;
};

export default function UpscaleImageButton({ id }: UpscaleImageButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpscale() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/images/${id}/upscale`, {
        method: "POST",
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to queue AI upscale");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue AI upscale");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleUpscale}
        disabled={isSubmitting}
        className="rounded-full border border-white/10 px-3 py-2 text-center text-slate-200 transition hover:border-violet-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Queueing..." : "AI Upscale"}
      </button>
      {error ? <p className="text-xs text-red-200">{error}</p> : null}
    </div>
  );
}
