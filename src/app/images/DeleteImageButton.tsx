"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteImageButtonProps = {
  id: string;
};

export default function DeleteImageButton({ id }: DeleteImageButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    setWarning(null);

    try {
      const response = await fetch(`/api/images/${id}`, {
        method: "DELETE",
      });

      const data = (await response.json().catch(() => null)) as { error?: string; warning?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to delete image");
      }

      if (data?.warning) {
        setWarning(data.warning);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-full border border-white/10 px-3 py-2 text-center text-slate-200 transition hover:border-red-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
      {warning ? <p className="text-xs text-amber-200">{warning}</p> : null}
      {error ? <p className="text-xs text-red-200">{error}</p> : null}
    </div>
  );
}
