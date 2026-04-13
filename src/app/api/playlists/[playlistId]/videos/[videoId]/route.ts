import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { syncPlaylistStats } from "@/lib/progress";
import { applyRateLimit, enforceSameOrigin, safeReadJson } from "@/lib/security";
import { requireDbUser } from "@/lib/user";
import { updateVideoSchema } from "@/lib/validators";

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

  const rateLimitError = applyRateLimit(request, `playlist-video-update:${user.id}`, { max: 120, windowMs: 60_000 });
  if (rateLimitError) {
    return rateLimitError;
  }

  const { playlistId, videoId } = await context.params;

  const payload = await safeReadJson(request);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
  const parsed = updateVideoSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const existingVideo = await db.video.findFirst({
    where: {
      id: videoId,
      playlistId,
      playlist: { userId: user.id },
    },
    select: {
      id: true,
      isWatched: true,
      notes: true,
      duration: true,
      watchedSeconds: true,
    },
  });

  if (!existingVideo) {
    return NextResponse.json({ error: "Playlist or video not found" }, { status: 404 });
  }

  const isWatched =
    typeof parsed.data.isWatched === "boolean" ? parsed.data.isWatched : existingVideo.isWatched;

  try {
    const updatedVideo = await db.video.update({
      where: { id: videoId },
      data: {
        isWatched,
        notes: typeof parsed.data.notes === "string" ? parsed.data.notes : undefined,
        watchedSeconds: isWatched
          ? existingVideo.duration > 0
            ? existingVideo.duration
            : existingVideo.watchedSeconds
          : typeof parsed.data.isWatched === "boolean"
            ? 0
            : existingVideo.watchedSeconds,
      },
    });

    const stats = await syncPlaylistStats(playlistId);

    return NextResponse.json({
      video: updatedVideo,
      progress: stats,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
  }
}

export async function DELETE(
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

  const rateLimitError = applyRateLimit(request, `playlist-video-delete:${user.id}`, { max: 40, windowMs: 60_000 });
  if (rateLimitError) {
    return rateLimitError;
  }

  const { playlistId, videoId } = await context.params;

  const existingVideo = await db.video.findFirst({
    where: {
      id: videoId,
      playlistId,
      playlist: { userId: user.id },
    },
    select: { id: true },
  });
  if (!existingVideo) {
    return NextResponse.json({ error: "Playlist or video not found" }, { status: 404 });
  }

  try {
    await db.video.delete({ where: { id: videoId } });

    const remainingVideos = await db.video.findMany({
      where: { playlistId },
      select: { id: true, order: true },
      orderBy: { order: "asc" },
    });

    const reorderUpdates = remainingVideos
      .map((video, index) => ({ id: video.id, nextOrder: index + 1, currentOrder: video.order }))
      .filter((item) => item.currentOrder !== item.nextOrder)
      .map((item) =>
        db.video.update({
          where: { id: item.id },
          data: { order: item.nextOrder },
        }),
      );

    if (reorderUpdates.length > 0) {
      await db.$transaction(reorderUpdates);
    }

    const stats = await syncPlaylistStats(playlistId);

    return NextResponse.json({ ok: true, progress: stats });
  } catch {
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
