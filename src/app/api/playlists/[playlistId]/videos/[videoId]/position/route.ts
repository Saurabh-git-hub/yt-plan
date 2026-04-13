import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { applyRateLimit, enforceSameOrigin, safeReadJson } from "@/lib/security";
import { requireDbUser } from "@/lib/user";
import { videoPositionSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ playlistId: string; videoId: string }> },
) {
  const user = await requireDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csrfError = enforceSameOrigin(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = applyRateLimit(request, `playlist-video-position:${user.id}`, { max: 240, windowMs: 60_000 });
  if (rateLimitError) {
    return rateLimitError;
  }

  const { playlistId, videoId } = await context.params;

  const video = await db.video.findFirst({
    where: {
      id: videoId,
      playlistId,
      playlist: { userId: user.id },
    },
    select: {
      id: true,
      duration: true,
      watchedSeconds: true,
      isWatched: true,
      playlist: {
        select: { totalVideos: true },
      },
    },
  });

  if (!video) {
    return NextResponse.json({ error: "Playlist or video not found" }, { status: 404 });
  }

  const payload = await safeReadJson(request);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
  const parsed = videoPositionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const watchedSeconds = Math.max(0, parsed.data.watchedSeconds);
  const payloadDuration = parsed.data.durationSeconds ? Math.ceil(parsed.data.durationSeconds) : 0;
  const actualDuration = payloadDuration > 0 ? payloadDuration : Math.max(0, video.duration);
  const cappedSeconds = actualDuration > 0 ? Math.min(Math.floor(watchedSeconds), actualDuration) : Math.floor(watchedSeconds);

  // Never move tracked progress backward from passive position sync calls.
  const nextWatchedSeconds = Math.max(video.watchedSeconds, cappedSeconds);

  // Mark complete only when reaching actual end, and do not unset complete here.
  const isWatched = video.isWatched || (actualDuration > 0 && nextWatchedSeconds >= actualDuration);
  const persistedWatchedSeconds = isWatched && actualDuration > 0 ? actualDuration : nextWatchedSeconds;

  try {
    const updatedVideo = await db.video.update({
      where: { id: video.id },
      data: {
        watchedSeconds: persistedWatchedSeconds,
        isWatched,
        duration: actualDuration > 0 ? actualDuration : video.duration,
      },
    });

    const completedVideos = await db.video.count({ where: { playlistId, isWatched: true } });
    const totalVideos = video.playlist.totalVideos ?? 0;
    const percentageCompleted = totalVideos > 0 ? Number(((completedVideos / totalVideos) * 100).toFixed(2)) : 0;

    const progress = await db.progress.upsert({
      where: { playlistId },
      create: {
        playlistId,
        completedVideos,
        percentageCompleted,
      },
      update: {
        completedVideos,
        percentageCompleted,
      },
    });

    return NextResponse.json({
      video: updatedVideo,
      progress,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update playback position" }, { status: 500 });
  }
}
