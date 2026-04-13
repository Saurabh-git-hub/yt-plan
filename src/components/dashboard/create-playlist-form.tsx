"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ToastStack, type ToastItem } from "@/components/ui/toast-stack";

function parseLinksInput(value: string) {
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .filter((item, index, array) => array.indexOf(item) === index);
}

async function readErrorMessage(response: Response) {
  try {
    const text = await response.text();
    if (!text) {
      return null;
    }

    const parsed = JSON.parse(text) as { error?: string };
    return typeof parsed.error === "string" && parsed.error.trim().length > 0 ? parsed.error : null;
  } catch {
    return null;
  }
}

export function CreatePlaylistForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [linksInput, setLinksInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = (message: string, type: ToastItem["type"] = "info") => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsedLinks = parseLinksInput(linksInput);
    if (parsedLinks.length === 0) {
      setError("Paste at least one YouTube video or playlist link.");
      pushToast("Add at least one valid link", "error");
      return;
    }

    startTransition(async () => {
      let response: Response;
      try {
        response = await fetch("/api/playlists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            links: parsedLinks,
          }),
        });
      } catch {
        const fallbackMessage = "Network error. Please try again.";
        setError(fallbackMessage);
        pushToast(fallbackMessage, "error");
        return;
      }

      if (!response.ok) {
        const message = (await readErrorMessage(response)) ?? "Unable to create playlist";
        setError(message);
        pushToast(message, "error");
        return;
      }

      setTitle("");
      setLinksInput("");
      pushToast("Playlist created", "success");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm text-zinc-300">
          Playlist title
        </label>
        <input
          id="title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Frontend Mastery Sprint"
          className="input-control h-11"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-zinc-300">Paste video links or a full playlist URL</p>
        <textarea
          value={linksInput}
          onChange={(event) => setLinksInput(event.target.value)}
          placeholder={
            "https://www.youtube.com/watch?v=...\nhttps://youtu.be/...\nhttps://www.youtube.com/playlist?list=..."
          }
          rows={5}
          className="input-control min-h-28 resize-y py-3"
        />
        <p className="text-xs text-zinc-500">
          Supports bulk paste: split by new line, spaces, or commas.
        </p>
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary"
      >
        {isPending ? "Creating..." : "Create Playlist"}
      </button>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </form>
  );
}
