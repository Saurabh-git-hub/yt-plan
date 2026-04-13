"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import { CreatePlaylistForm } from "@/components/dashboard/create-playlist-form";
import { PlaylistCard } from "@/components/dashboard/playlist-card";
import { cn } from "@/lib/utils";

interface PlaylistCardData {
  id: string;
  title: string;
  totalVideos: number;
  totalDuration: number;
  percentageCompleted: number;
  firstVideoYoutubeId: string | null;
}

interface PlaylistsPageClientProps {
  playlists: PlaylistCardData[];
  completedCount: number;
}

export function PlaylistsPageClient({ playlists, completedCount }: PlaylistsPageClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (!isCreateOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCreateOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isCreateOpen]);

  return (
    <>
      <div className="grid w-full gap-6">
        <section className="rounded-3xl border border-white/10 bg-[#101611] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.3)] md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-lime-200">Your Library</p>
              <h1 className="mt-3 text-3xl font-semibold text-zinc-50 md:text-5xl">All Playlists</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
                Manage every playlist you have created, track completion, edit titles, and continue learning from one
                place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl borderborder-lime-300/40 bg-lime-300 px-4 py-2.5 text-sm font-semibold text-[#081108] transition hover:bg-lime-200"
            >
              <Plus size={16} />
              Create Playlist
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3">
              <p className="text-xs text-zinc-500">Total playlists</p>
              <p className="mt-1 text-xl font-semibold text-white">{playlists.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3">
              <p className="text-xs text-zinc-500">Completed</p>
              <p className="mt-1 text-xl font-semibold text-white">{completedCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3">
              <p className="text-xs text-zinc-500">In progress</p>
              <p className="mt-1 text-xl font-semibold text-white">{Math.max(playlists.length - completedCount, 0)}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-100">All Created Playlists</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                id={playlist.id}
                title={playlist.title}
                totalVideos={playlist.totalVideos}
                totalDuration={playlist.totalDuration}
                percentageCompleted={playlist.percentageCompleted}
                firstVideoYoutubeId={playlist.firstVideoYoutubeId}
              />
            ))}
          </div>
          {playlists.length === 0 ? (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-zinc-400 backdrop-blur-xl">
              No playlists yet. Create your first PlanYt learning path.
            </p>
          ) : null}
        </section>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200",
          isCreateOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsCreateOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200",
          isCreateOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!isCreateOpen}
      >
        <div
          className={cn(
            "w-full max-w-2xl rounded-3xl border border-white/15 bg-[#0e1410]/95 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-transform duration-200 md:p-6",
            isCreateOpen ? "translate-y-0 scale-100" : "translate-y-2 scale-[0.98]",
          )}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Create playlist"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-zinc-50">Create Playlist</h3>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-zinc-300 transition hover:text-zinc-100"
              aria-label="Close create playlist dialog"
            >
              <X size={16} />
            </button>
          </div>

          <CreatePlaylistForm />
        </div>
      </div>
    </>
  );
}
