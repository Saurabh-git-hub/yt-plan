"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

interface SharedVideoItem {
  id: string;
  title: string;
  youtubeId: string;
  duration: number;
  order: number;
}

interface SharedPlaylistViewProps {
  title: string;
  ownerLabel: string;
  videos: SharedVideoItem[];
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  if (safeSeconds <= 0) {
    return "Duration syncing...";
  }

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function SharedPlaylistView({ title, ownerLabel, videos }: SharedPlaylistViewProps) {
  const [selectedVideoId, setSelectedVideoId] = useState(videos[0]?.id ?? "");

  const currentVideo = useMemo(
    () => videos.find((video) => video.id === selectedVideoId) ?? videos[0],
    [selectedVideoId, videos],
  );

  if (!currentVideo) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/3 p-6">
        <p className="text-zinc-300">This shared playlist has no videos yet.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:items-start">
      <section className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-[#111712]/80 p-4 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-lime-200">Shared Playlist</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-100 md:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-zinc-400">Shared by {ownerLabel}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111712]/80 backdrop-blur-xl">
          <div className="aspect-video w-full">
            <iframe
              key={currentVideo.youtubeId}
              src={`https://www.youtube-nocookie.com/embed/${currentVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={currentVideo.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <aside className="rounded-2xl border border-white/10 bg-white/3 p-4 backdrop-blur-xl">
        <p className="mb-3 text-sm font-semibold text-zinc-100">Course structure</p>
        <div className="space-y-2">
          {videos.map((video) => {
            const isActive = video.id === currentVideo.id;
            return (
              <button
                key={video.id}
                type="button"
                onClick={() => setSelectedVideoId(video.id)}
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-left transition",
                  isActive
                    ? "border-lime-300/45 bg-lime-300/10 text-lime-100"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20",
                )}
              >
                <p className="line-clamp-2 text-sm font-medium">{video.order}. {video.title}</p>
                <p className="mt-1 text-xs text-zinc-400">{formatDuration(video.duration)}</p>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
