import Link from "next/link";

import { CreatePlaylistForm } from "@/components/dashboard/create-playlist-form";
import { GoalCard } from "@/components/dashboard/goal-card";
import { PlaylistCard } from "@/components/dashboard/playlist-card";
import { db } from "@/lib/db";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { requireDbUser } from "@/lib/user";

export default async function DashboardPage() {
  let user;
  try {
    user = await requireDbUser();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return null;
    }
    throw error;
  }

  if (!user) {
    return null;
  }

  const playlists = await db.playlist.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      title: true,
      totalVideos: true,
      totalDuration: true,
      progress: {
        select: {
          completedVideos: true,
          percentageCompleted: true,
        },
      },
      goal: {
        select: {
          targetDays: true,
          videosPerDay: true,
          estimatedDailyTime: true,
        },
      },
      videos: {
        select: { youtubeId: true },
        orderBy: { order: "asc" },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const recentPlaylists = playlists.slice(0, 2);

  const nextGoalPlaylist = playlists.find(
    (playlist) => playlist.goal && (playlist.progress?.percentageCompleted ?? 0) < 100,
  );
  const completed = nextGoalPlaylist?.progress?.completedVideos ?? 0;
  const remainingVideos = Math.max((nextGoalPlaylist?.totalVideos ?? 0) - completed, 0);

  return (
    <div className="grid w-full gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#101611] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.3)] md:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-48 w-80 rounded-full bg-lime-300/15 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.3em] text-lime-200">PlanYt Dashboard</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold text-zinc-50 md:text-5xl">Build learning systems that actually get completed.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
          Create structured playlists, track watch progress automatically, and hit your learning goals with daily plans.
        </p>
      </section>

      {nextGoalPlaylist?.goal ? (
        <GoalCard
          targetDays={nextGoalPlaylist.goal.targetDays}
          videosPerDay={nextGoalPlaylist.goal.videosPerDay}
          estimatedDailyTime={nextGoalPlaylist.goal.estimatedDailyTime}
          remainingVideos={remainingVideos}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-100">Recent Playlists</h2>
            <Link
              href="/playlists"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-lime-300/50 hover:text-zinc-100"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {recentPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                id={playlist.id}
                title={playlist.title}
                totalVideos={playlist.totalVideos}
                totalDuration={playlist.totalDuration}
                percentageCompleted={playlist.progress?.percentageCompleted ?? 0}
                firstVideoYoutubeId={playlist.videos[0]?.youtubeId ?? null}
              />
            ))}
          </div>
          {recentPlaylists.length === 0 ? (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-zinc-400 backdrop-blur-xl">
              No playlists yet. Create your first PlanYt learning path.
            </p>
          ) : null}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-100">Create Playlist</h2>
          <CreatePlaylistForm />
        </section>
      </div>
    </div>
  );
}
