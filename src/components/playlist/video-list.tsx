"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface VideoItem {
  id: string;
  title: string;
  youtubeId: string;
  duration: number;
  order: number;
  watchedSeconds: number;
  isWatched: boolean;
}

interface VideoListProps {
  videos: VideoItem[];
  currentVideoId: string;
  onSelect: (videoId: string) => void;
  onToggleWatched: (videoId: string, watched: boolean) => void;
  onDelete: (videoId: string) => void;
  onReorder: (orderedVideoIds: string[]) => void;
}

export function VideoList({ videos, currentVideoId, onSelect, onToggleWatched, onDelete, onReorder }: VideoListProps) {
  const [draggingVideoId, setDraggingVideoId] = useState<string | null>(null);

  const getVideoStatus = (video: VideoItem) => {
    if (video.isWatched) {
      return "Completed";
    }

    if (video.watchedSeconds > 0) {
      return "In Progress";
    }

    return "Not Started";
  };

  const handleDrop = (targetId: string) => {
    if (!draggingVideoId || draggingVideoId === targetId) {
      setDraggingVideoId(null);
      return;
    }

    const fromIndex = videos.findIndex((video) => video.id === draggingVideoId);
    const toIndex = videos.findIndex((video) => video.id === targetId);

    if (fromIndex < 0 || toIndex < 0) {
      setDraggingVideoId(null);
      return;
    }

    const reordered = [...videos];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    onReorder(reordered.map((video) => video.id));
    setDraggingVideoId(null);
  };

  const formatDuration = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    if (safeSeconds <= 0) {
      return "Duration syncing...";
    }

    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;
    const paddedMinutes = String(minutes).padStart(2, "0");
    const paddedSeconds = String(remainingSeconds).padStart(2, "0");

    if (hours > 0) {
      return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }

    return `${minutes}:${paddedSeconds}`;
  };

  const statusTone = (video: VideoItem) => {
    if (video.isWatched) {
      return "border-emerald-400/30 bg-emerald-400/15 text-emerald-300";
    }

    if (video.watchedSeconds > 0) {
      return "border-lime-300/35 bg-lime-300/12 text-lime-200";
    }

    return "border-zinc-500/30 bg-zinc-500/15 text-zinc-300";
  };

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Drag cards to reorder</p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {videos.map((video) => {
          const active = currentVideoId === video.id;

          return (
            <article
              key={video.id}
              draggable
              onDragStart={() => setDraggingVideoId(video.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(video.id)}
              className={cn(
                "overflow-hidden rounded-2xl border bg-[#0d1410] shadow-[0_16px_36px_rgba(0,0,0,0.28)] transition-all duration-200",
                "cursor-grab active:cursor-grabbing",
                draggingVideoId === video.id ? "scale-[0.99] opacity-65" : "opacity-100",
                active ? "border-lime-300/55 ring-1 ring-lime-300/40" : "border-white/10 hover:border-white/20",
              )}
            >
              <button type="button" onClick={() => onSelect(video.id)} className="w-full text-left">
                <div className="relative aspect-video overflow-hidden border-b border-white/10 bg-zinc-900">
                  <Image
                    src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
                    alt={video.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute left-2 top-2 rounded-md border border-black/35 bg-black/60 px-2 py-1 text-xs font-medium text-zinc-100">
                    Video {video.order}
                  </span>
                </div>

                <div className="space-y-3 p-3">
                  <h3 className="line-clamp-2 text-base font-semibold leading-6 text-zinc-100">{video.title}</h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-zinc-400">{formatDuration(video.duration)}</span>
                    <span className={cn("rounded-full border px-2 py-0.5 font-semibold", statusTone(video))}>
                      {getVideoStatus(video).toUpperCase()}
                    </span>
                  </div>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-3">
                <button
                  type="button"
                  onClick={() => onToggleWatched(video.id, !video.isWatched)}
                  aria-label={video.isWatched ? "Mark as in progress" : "Mark as complete"}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    video.isWatched
                      ? "border-white/20 bg-white/5 text-zinc-200 hover:bg-white/10"
                      : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20",
                  )}
                >
                  {video.isWatched ? "Mark In Progress" : "Mark Complete"}
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(video.id)}
                  aria-label="Delete video"
                  className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-400/20"
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
