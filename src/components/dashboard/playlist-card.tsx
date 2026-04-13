"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock3, ListVideo, Pencil, Trash2 } from "lucide-react";

import { ProgressBar } from "@/components/ui/progress-bar";

interface PlaylistCardProps {
  id: string;
  title: string;
  totalVideos: number;
  totalDuration: number;
  percentageCompleted: number;
  firstVideoYoutubeId?: string | null;
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const totalMinutes = Math.round(safeSeconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

export function PlaylistCard({
  id,
  title,
  totalVideos,
  totalDuration,
  percentageCompleted,
  firstVideoYoutubeId,
}: PlaylistCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [nextTitle, setNextTitle] = useState(title);

  const onDelete = () => {
    startTransition(async () => {
      const response = await fetch(`/api/playlists/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      }
    });
  };

  const onSaveTitle = () => {
    const cleaned = nextTitle.trim();
    if (cleaned.length < 2) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/playlists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: cleaned }),
      });

      if (response.ok) {
        setEditing(false);
        router.refresh();
      }
    });
  };

  const goToPlaylist = () => {
    if (editing) {
      return;
    }

    router.push(`/playlists/${id}`);
  };

  const onCardClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea")) {
      return;
    }

    goToPlaylist();
  };

  const onCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    goToPlaylist();
  };

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={onCardClick}
      onKeyDown={onCardKeyDown}
      className="group cursor-pointer rounded-2xl border border-white/10 bg-white/3 p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-lime-300/35 hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
    >
      <div className="relative mb-4 aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#0b0f0c]">
        {firstVideoYoutubeId ? (
          <Image
            src={`https://i.ytimg.com/vi/${firstVideoYoutubeId}/hqdefault.jpg`}
            alt={`${title} thumbnail`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(163,230,53,0.2),rgba(12,18,15,0.9))]">
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-300">No Thumbnail</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
      </div>

      <div className="mb-4 flex items-start justify-between gap-3">
        {editing ? (
          <div className="flex w-full items-center gap-2">
            <input
              value={nextTitle}
              onChange={(event) => setNextTitle(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0d1410] px-2 py-1.5 text-sm text-zinc-100 outline-none"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={onSaveTitle}
              className="rounded-md bg-lime-300 px-2.5 py-1.5 text-xs font-semibold text-[#0a0e0b] transition hover:bg-lime-200"
            >
              Save
            </button>
          </div>
        ) : (
          <h3 className="text-lg font-semibold text-zinc-50">{title}</h3>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((prev) => !prev)}
            className="rounded-md border border-white/15 p-1.5 text-zinc-300 hover:border-lime-300/50"
            aria-label="Edit playlist"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onDelete}
            className="rounded-md border border-rose-500/40 p-1.5 text-rose-300 hover:border-rose-500"
            aria-label="Delete playlist"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <ListVideo size={14} />
          {totalVideos} videos
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock3 size={14} />
          {formatDuration(totalDuration)}
        </span>
      </div>

      <ProgressBar value={percentageCompleted} />
      <p className="mt-2 text-sm text-zinc-400">
        <span className="text-lime-200">{Math.round(percentageCompleted)}%</span> completed
      </p>

      <Link
        href={`/playlists/${id}`}
        className="mt-4 inline-flex rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-lime-300/50"
      >
        Open playlist
      </Link>
    </article>
  );
}
