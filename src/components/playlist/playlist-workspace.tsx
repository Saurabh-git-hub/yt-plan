"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import type { GoalMode } from "@prisma/client";
import { ChevronDown } from "lucide-react";

import { GoalCard } from "@/components/dashboard/goal-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ToastStack, type ToastItem } from "@/components/ui/toast-stack";

const VideoList = dynamic(
  () => import("@/components/playlist/video-list").then((mod) => mod.VideoList),
);

const YouTubePlayer = dynamic(
  () => import("@/components/playlist/youtube-player").then((mod) => mod.YouTubePlayer),
  {
    loading: () => (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111712]/80 backdrop-blur-xl">
        <div className="aspect-video w-full animate-pulse bg-white/5" />
      </div>
    ),
  },
);

interface PlaylistVideo {
  id: string;
  title: string;
  youtubeId: string;
  duration: number;
  watchedSeconds: number;
  notes: string;
  order: number;
  isWatched: boolean;
}

interface PlaylistWorkspaceProps {
  playlistId: string;
  playlistTitle: string;
  totalVideos: number;
  initialPercentage: number;
  initialGoal: {
    mode: GoalMode;
    targetDays: number;
    minutesPerDay: number | null;
    deadline: string | null;
    videosPerDay: number;
    estimatedDailyTime: number;
  } | null;
  videos: PlaylistVideo[];
}

type GoalFormMode = "minutes" | "deadline";

function percentageFromCount(completed: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Number(((completed / total) * 100).toFixed(2));
}

export function PlaylistWorkspace({
  playlistId,
  playlistTitle,
  totalVideos,
  initialPercentage,
  initialGoal,
  videos,
}: PlaylistWorkspaceProps) {
  const [isPending, startTransition] = useTransition();
  const [localVideos, setLocalVideos] = useState(videos);
  const [currentVideoId, setCurrentVideoId] = useState(videos[0]?.id ?? "");
  const [goalMode, setGoalMode] = useState<GoalFormMode>(
    initialGoal?.mode === "DEADLINE" ? "deadline" : "minutes",
  );
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [minutesPerDay, setMinutesPerDay] = useState(initialGoal?.minutesPerDay ?? 30);
  const [deadline, setDeadline] = useState(
    initialGoal?.deadline ? initialGoal.deadline.slice(0, 10) : "",
  );
  const [goal, setGoal] = useState(initialGoal);
  const [totalVideoCount, setTotalVideoCount] = useState(totalVideos);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [addVideoModalOpen, setAddVideoModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [percentage, setPercentage] = useState(initialPercentage);
  const [notesDraft, setNotesDraft] = useState(videos[0]?.notes ?? "");
  const [notesStatus, setNotesStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isCourseStructureOpen, setIsCourseStructureOpen] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSharingPlaylist, setIsSharingPlaylist] = useState(false);
  const [autoplayRequestedVideoId, setAutoplayRequestedVideoId] = useState<string | null>(null);
  const notesSaveTimerRef = useRef<number | null>(null);
  const playerSectionRef = useRef<HTMLElement | null>(null);

  // Reused lookup map avoids repeated O(n) scans during reorder/select actions.
  const videoMap = useMemo(
    () => new Map(localVideos.map((video) => [video.id, video] as const)),
    [localVideos],
  );

  const currentVideo = useMemo(
    () => videoMap.get(currentVideoId) ?? localVideos[0],
    [currentVideoId, localVideos, videoMap],
  );

  const completedVideos = useMemo(
    () => localVideos.filter((video) => video.isWatched).length,
    [localVideos],
  );

  const pushToast = useCallback((message: string, type: ToastItem["type"] = "info") => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const onToggleWatched = (videoId: string, isWatched: boolean) => {
    setError(null);

    const previousVideos = localVideos;
    const previousPercentage = percentage;
    const nextVideos = previousVideos.map((video) =>
      video.id === videoId ? { ...video, isWatched } : video,
    );

    setLocalVideos(nextVideos);
    setPercentage(percentageFromCount(nextVideos.filter((video) => video.isWatched).length, totalVideoCount));

    startTransition(async () => {
      const response = await fetch(`/api/playlists/${playlistId}/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isWatched }),
      });

      if (!response.ok) {
        setLocalVideos(previousVideos);
        setPercentage(previousPercentage);
        setError("Unable to update video status");
        pushToast("Could not update video status", "error");
        return;
      }

      const data = (await response.json()) as {
        video: { id: string; isWatched: boolean; watchedSeconds: number };
        progress: { percentageCompleted: number };
      };

      setLocalVideos((prev) =>
        prev.map((video) =>
          video.id === data.video.id
            ? {
                ...video,
                isWatched: data.video.isWatched,
                watchedSeconds: data.video.watchedSeconds,
              }
            : video,
        ),
      );
      setPercentage(data.progress.percentageCompleted);
      pushToast(data.video.isWatched ? "Marked as completed" : "Marked as in progress", "success");
    });
  };

  const onReorderVideos = (orderedVideoIds: string[]) => {
    const previousVideos = localVideos;

    const reorderedVideos = orderedVideoIds
      .map((videoId, index) => {
        const found = videoMap.get(videoId);
        return found ? { ...found, order: index + 1 } : null;
      })
      .filter((video): video is PlaylistVideo => Boolean(video));

    if (reorderedVideos.length !== localVideos.length) {
      return;
    }

    setLocalVideos(reorderedVideos);
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/playlists/${playlistId}/videos/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoIds: orderedVideoIds }),
      });

      if (!response.ok) {
        setLocalVideos(previousVideos);
        setError("Unable to reorder videos");
        pushToast("Video reorder failed", "error");
        return;
      }

      pushToast("Video order updated", "success");
    });
  };

  const onAddVideo = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = newVideoUrl.trim();
    if (!trimmed) {
      pushToast("Enter a YouTube video URL", "error");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/playlists/${playlistId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl: trimmed }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        pushToast(data.error ?? "Unable to add video", "error");
        return;
      }

      const data = (await response.json()) as {
        video: PlaylistVideo;
        progress: { percentageCompleted: number; totalVideos: number };
      };

      setLocalVideos((prev) => [...prev, data.video]);
      setTotalVideoCount(data.progress.totalVideos);
      setPercentage(data.progress.percentageCompleted);
      setNewVideoUrl("");
      setAddVideoModalOpen(false);
      pushToast("Video added", "success");
    });
  };

  const onDeleteVideo = (videoId: string) => {
    const target = localVideos.find((video) => video.id === videoId);
    if (!target) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/playlists/${playlistId}/videos/${videoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        pushToast(data.error ?? "Unable to delete video", "error");
        return;
      }

      const data = (await response.json()) as {
        progress: { percentageCompleted: number; totalVideos: number };
      };

      const nextVideos = localVideos
        .filter((video) => video.id !== videoId)
        .map((video, index) => ({ ...video, order: index + 1 }));

      setLocalVideos(nextVideos);
      setTotalVideoCount(data.progress.totalVideos);
      setPercentage(data.progress.percentageCompleted);

      if (currentVideoId === videoId) {
        setCurrentVideoId(nextVideos[0]?.id ?? "");
        setNotesDraft(nextVideos[0]?.notes ?? "");
      }

      pushToast("Video deleted", "success");
    });
  };

  const onSetGoal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const payload =
      goalMode === "minutes"
        ? { mode: "minutes", minutesPerDay: Number(minutesPerDay) }
        : { mode: "deadline", deadline };

    startTransition(async () => {
      const response = await fetch(`/api/playlists/${playlistId}/goal`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError("Unable to update goal");
        pushToast("Could not save goal", "error");
        return;
      }

      const data = (await response.json()) as {
        mode: GoalMode;
        targetDays: number;
        minutesPerDay: number | null;
        deadline: string | null;
        videosPerDay: number;
        estimatedDailyTime: number;
      };

      setGoal({
        mode: data.mode,
        targetDays: data.targetDays,
        minutesPerDay: data.minutesPerDay,
        deadline: data.deadline,
        videosPerDay: data.videosPerDay,
        estimatedDailyTime: data.estimatedDailyTime,
      });
      setGoalModalOpen(false);
      pushToast("Goal saved", "success");
    });
  };

  const onSharePlaylist = async () => {
    setIsSharingPlaylist(true);
    setError(null);

    try {
      const response = await fetch(`/api/playlists/${playlistId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        pushToast("Could not create share link", "error");
        return;
      }

      const data = (await response.json()) as { sharePath?: string | null };
      if (!data.sharePath) {
        pushToast("Share link unavailable", "error");
        return;
      }

      const absoluteLink = `${window.location.origin}${data.sharePath}`;
      await navigator.clipboard.writeText(absoluteLink);
      pushToast("Share link copied", "success");
    } catch {
      pushToast("Could not copy share link", "error");
    } finally {
      setIsSharingPlaylist(false);
    }
  };

  const saveNotesForVideo = useCallback(
    async (videoId: string, nextNotes: string, showToast = true) => {
      setError(null);
      setNotesStatus("saving");

      setLocalVideos((prev) => prev.map((video) => (video.id === videoId ? { ...video, notes: nextNotes } : video)));

      const response = await fetch(`/api/playlists/${playlistId}/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: nextNotes }),
      });

      if (!response.ok) {
        setNotesStatus("error");
        setError("Unable to save notes");
        if (showToast) {
          pushToast("Could not save notes", "error");
        }
        return;
      }

      const data = (await response.json()) as { video: { id: string; notes: string } };
      setLocalVideos((prev) =>
        prev.map((video) => (video.id === data.video.id ? { ...video, notes: data.video.notes } : video)),
      );
      setNotesStatus("saved");
      if (showToast) {
        pushToast("Notes auto-saved", "success");
      }
    },
    [playlistId, pushToast],
  );

  const onSaveNotes = () => {
    if (!currentVideo) {
      return;
    }

    startTransition(async () => {
      await saveNotesForVideo(currentVideo.id, notesDraft, true);
      setNotesModalOpen(false);
    });
  };

  const remainingFromState = Math.max(totalVideoCount - completedVideos, 0);

  const onPlayerTrack = useCallback(
    (
      videoId: string,
      tracked: {
        watchedSeconds: number;
        isWatched?: boolean;
        percentageCompleted?: number;
        durationSeconds?: number;
      },
    ) => {
      if (typeof tracked.percentageCompleted === "number") {
        setPercentage(tracked.percentageCompleted);
      }

      setLocalVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? {
                ...video,
                watchedSeconds: tracked.watchedSeconds,
                isWatched:
                  typeof tracked.isWatched === "boolean" ? tracked.isWatched : video.isWatched,
                duration:
                  typeof tracked.durationSeconds === "number" && tracked.durationSeconds > 0
                    ? tracked.durationSeconds
                    : video.duration,
              }
            : video,
        ),
      );
    },
    [],
  );

  const onSelectVideo = (videoId: string) => {
    if (notesSaveTimerRef.current) {
      window.clearTimeout(notesSaveTimerRef.current);
      notesSaveTimerRef.current = null;
    }

    setAutoplayRequestedVideoId(videoId);
    setCurrentVideoId(videoId);
    const selected = videoMap.get(videoId);
    setNotesDraft(selected?.notes ?? "");
    setNotesStatus("idle");

    window.requestAnimationFrame(() => {
      playerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  useEffect(() => {
    if (!currentVideo) {
      return;
    }

    if (notesDraft === currentVideo.notes) {
      return;
    }

    if (notesSaveTimerRef.current) {
      window.clearTimeout(notesSaveTimerRef.current);
    }

    notesSaveTimerRef.current = window.setTimeout(() => {
      void saveNotesForVideo(currentVideo.id, notesDraft, true);
    }, 900);

    return () => {
      if (notesSaveTimerRef.current) {
        window.clearTimeout(notesSaveTimerRef.current);
      }
    };
  }, [currentVideo, notesDraft, saveNotesForVideo]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-lime-200">PlanYt Playlist Workspace</p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-50 md:text-4xl">{playlistTitle}</h1>
          </div>
          <button
            type="button"
            onClick={() => setGoalModalOpen(true)}
            className="btn-primary w-full md:w-auto"
          >
            {goal ? "Update Completion Goal" : "Set Completion Goal"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] lg:items-start">
        <section ref={playerSectionRef} className="space-y-5">
          {currentVideo ? (
            <YouTubePlayer
              key={currentVideo.id}
              youtubeId={currentVideo.youtubeId}
              playlistId={playlistId}
              videoId={currentVideo.id}
              initialWatchedSeconds={currentVideo.watchedSeconds}
              initialIsWatched={currentVideo.isWatched}
              autoPlayEnabled={autoplayRequestedVideoId === currentVideo.id}
              onTrack={(tracked) => onPlayerTrack(currentVideo.id, tracked)}
              onSyncEvent={() => {
                if (autoplayRequestedVideoId === currentVideo.id) {
                  setAutoplayRequestedVideoId(null);
                }
              }}
            />
          ) : null}

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        </section>

        <aside className="space-y-5">
          {goal ? (
            <GoalCard
              targetDays={goal.targetDays}
              videosPerDay={goal.videosPerDay}
              estimatedDailyTime={goal.estimatedDailyTime}
              remainingVideos={remainingFromState}
            />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
              <p className="text-sm text-zinc-300">No goal set yet</p>
              <p className="mt-2 text-sm text-zinc-500">Set a target to unlock your daily plan.</p>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <p className="mb-3 text-sm text-zinc-300">Progress details</p>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-zinc-400">Completion</p>
              <p className="text-sm font-medium text-lime-200">{Math.round(percentage)}%</p>
            </div>
            <ProgressBar value={percentage} />
            <p className="mt-3 text-sm text-zinc-400">
              {completedVideos}/{totalVideoCount} completed • {remainingFromState} remaining
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAddVideoModalOpen(true)}
              className="btn-primary h-10 w-full px-4 text-xs"
              disabled={isPending}
            >
              Add Video
            </button>
            <button
              type="button"
              onClick={() => setNotesModalOpen(true)}
              className="btn-secondary h-10 w-full px-4 text-xs"
              disabled={isPending || !currentVideo}
            >
              Save Notes
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              void onSharePlaylist();
            }}
            className="btn-secondary h-10 w-full px-4 text-xs"
            disabled={isPending || isSharingPlaylist}
          >
            {isSharingPlaylist ? "Creating share link..." : "Share Playlist"}
          </button>
        </aside>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-300">Course structure</p>
          <button
            type="button"
            onClick={() => setIsCourseStructureOpen((prev) => !prev)}
            aria-label={isCourseStructureOpen ? "Collapse course structure" : "Expand course structure"}
            aria-expanded={isCourseStructureOpen}
            className="rounded-full border border-white/15 p-1.5 text-zinc-400 transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-zinc-100"
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ease-out ${
                isCourseStructureOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>
        </div>

        <div
          className={`grid overflow-hidden transition-all duration-300 ease-out ${
            isCourseStructureOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <VideoList
              videos={localVideos}
              currentVideoId={currentVideo?.id ?? ""}
              onSelect={onSelectVideo}
              onToggleWatched={onToggleWatched}
              onDelete={onDeleteVideo}
              onReorder={onReorderVideos}
            />
          </div>
        </div>
      </section>

      {goalModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0d1410]/95 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-semibold text-zinc-100">Set completion goal</p>
              <button
                type="button"
                onClick={() => setGoalModalOpen(false)}
                className="rounded-md px-2 py-1 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={onSetGoal} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setGoalMode("minutes")}
                  className={`rounded-lg border px-3 py-2 ${
                    goalMode === "minutes"
                      ? "border-lime-300/60 bg-lime-300/10 text-lime-200"
                      : "border-white/15 text-zinc-400"
                  }`}
                >
                  Watch X min/day
                </button>
                <button
                  type="button"
                  onClick={() => setGoalMode("deadline")}
                  className={`rounded-lg border px-3 py-2 ${
                    goalMode === "deadline"
                      ? "border-lime-300/60 bg-lime-300/10 text-lime-200"
                      : "border-white/15 text-zinc-400"
                  }`}
                >
                  Finish by date
                </button>
              </div>

              {goalMode === "minutes" ? (
                <div className="space-y-2">
                  <label className="text-sm text-zinc-300">Minutes per day</label>
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={minutesPerDay}
                    onChange={(event) => setMinutesPerDay(Number(event.target.value))}
                    className="input-control h-11"
                    required
                  />
                </div>
              ) : null}

              {goalMode === "deadline" ? (
                <div className="space-y-2">
                  <label className="text-sm text-zinc-300">Target date</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                    className="input-control h-11"
                    required
                  />
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isPending}
                className="btn-primary w-full"
              >
                {isPending ? "Saving..." : "Save Goal"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {addVideoModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#0d1410]/95 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-semibold text-zinc-100">Add video</p>
              <button
                type="button"
                onClick={() => setAddVideoModalOpen(false)}
                className="rounded-md px-2 py-1 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={onAddVideo} className="space-y-3">
              <input
                value={newVideoUrl}
                onChange={(event) => setNewVideoUrl(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="input-control h-11"
              />
              <button type="submit" className="btn-primary w-full" disabled={isPending}>
                {isPending ? "Adding..." : "Add Video"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {notesModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0d1410]/95 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-zinc-100">Video notes</p>
                <p className="mt-1 text-xs text-zinc-500">{currentVideo?.title ?? "No video selected"}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotesModalOpen(false)}
                className="rounded-md px-2 py-1 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-300">Write key takeaways and action items</p>
                <p className="text-xs text-zinc-500">{notesDraft.length}/5000</p>
              </div>

              <textarea
                value={notesDraft}
                onChange={(event) => {
                  setNotesDraft(event.target.value);
                  setNotesStatus("idle");
                }}
                rows={8}
                maxLength={5000}
                placeholder="Write takeaways, action items, and references for this video..."
                className="input-control min-h-32 resize-y py-3"
                disabled={!currentVideo}
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">
                  {notesStatus === "saving"
                    ? "Saving..."
                    : notesStatus === "saved"
                      ? "Saved"
                      : notesStatus === "error"
                        ? "Save failed"
                        : ""}
                </p>
                <button
                  type="button"
                  onClick={onSaveNotes}
                  className="btn-primary"
                  disabled={isPending || !currentVideo}
                >
                  {isPending ? "Saving..." : "Save notes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
