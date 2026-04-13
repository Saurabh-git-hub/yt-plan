import { notFound } from "next/navigation";

import { PlaylistWorkspace } from "@/components/playlist/playlist-workspace";
import { db } from "@/lib/db";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { syncPlaylistStats } from "@/lib/progress";
import { requireDbUser } from "@/lib/user";
import {
  fetchYouTubeTitlesFromOEmbed,
  fetchYouTubeVideoMetadata,
  isPlaceholderVideoTitle,
} from "@/lib/youtube";

const LEGACY_DEFAULT_DURATION_SECONDS = 600;

export default async function PlaylistPage({ params }: { params: Promise<{ playlistId: string }> }) {
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

  const { playlistId } = await params;
  const ownedPlaylist = await db.playlist.findFirst({
    where: {
      id: playlistId,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!ownedPlaylist) {
    notFound();
  }

  await syncPlaylistStats(playlistId);

  const existingVideos = await db.video.findMany({
    where: { playlistId },
    select: { id: true, title: true, youtubeId: true, duration: true },
  });

  const videosNeedingMetadata = existingVideos.filter(
    (video) =>
      video.duration <= 0 ||
      video.duration === LEGACY_DEFAULT_DURATION_SECONDS ||
      isPlaceholderVideoTitle(video.title),
  );

  const metadata = await fetchYouTubeVideoMetadata(videosNeedingMetadata.map((video) => video.youtubeId));
  const metadataUpdates = videosNeedingMetadata
    .map((video) => {
      const details = metadata.get(video.youtubeId);
      if (!details?.duration || details.duration <= 0) {
        return null;
      }

      const shouldFixDuration =
        video.duration <= 0 ||
        video.duration === LEGACY_DEFAULT_DURATION_SECONDS ||
        video.duration !== details.duration;

      if (!shouldFixDuration) {
        return null;
      }

      return db.video.update({
        where: { id: video.id },
        data: { duration: details.duration },
      });
    })
    .filter((query): query is ReturnType<typeof db.video.update> => Boolean(query));

  if (metadataUpdates.length > 0) {
    await db.$transaction(metadataUpdates);
  }

  const missingTitleVideos = videosNeedingMetadata.filter((video) => isPlaceholderVideoTitle(video.title));
  if (missingTitleVideos.length > 0) {
    const fetchedTitles = await fetchYouTubeTitlesFromOEmbed(
      missingTitleVideos.map((video) => video.youtubeId),
    );

    const updates = missingTitleVideos
      .map((video) => {
        const nextTitle = fetchedTitles.get(video.youtubeId);
        if (!nextTitle) {
          return null;
        }

        return db.video.update({
          where: { id: video.id },
          data: { title: nextTitle },
        });
      })
      .filter((query): query is ReturnType<typeof db.video.update> => Boolean(query));

    if (updates.length > 0) {
      await db.$transaction(updates);
    }
  }

  if (metadataUpdates.length > 0 || missingTitleVideos.length > 0) {
    await syncPlaylistStats(playlistId);
  }

  const playlist = await db.playlist.findUnique({
    where: {
      id: playlistId,
    },
    include: {
      progress: true,
      goal: true,
      videos: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!playlist) {
    notFound();
  }

  return (
    <div className="w-full">
      <PlaylistWorkspace
        playlistId={playlist.id}
        playlistTitle={playlist.title}
        totalVideos={playlist.totalVideos}
        initialPercentage={playlist.progress?.percentageCompleted ?? 0}
        initialGoal={
          playlist.goal
            ? {
                mode: playlist.goal.mode,
                targetDays: playlist.goal.targetDays,
                minutesPerDay: playlist.goal.minutesPerDay,
                deadline: playlist.goal.deadline ? playlist.goal.deadline.toISOString() : null,
                videosPerDay: playlist.goal.videosPerDay,
                estimatedDailyTime: playlist.goal.estimatedDailyTime,
              }
            : null
        }
        videos={playlist.videos.map((video) => ({
          id: video.id,
          title: video.title,
          youtubeId: video.youtubeId,
          duration: video.duration,
          watchedSeconds: video.watchedSeconds,
          notes: video.notes,
          order: video.order,
          isWatched: video.isWatched,
        }))}
      />
    </div>
  );
}
