import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { syncPlaylistStats } from "@/lib/progress";
import { applyRateLimit, enforceSameOrigin, safeReadJson } from "@/lib/security";
import { requireDbUser } from "@/lib/user";
import { addVideoSchema } from "@/lib/validators";
import {
  extractYouTubeId,
  fetchYouTubeVideoMetadata,
} from "@/lib/youtube";

export async function POST(request: Request, context: { params: Promise<{ playlistId: string }> }) {
  const user = await requireDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csrfError = enforceSameOrigin(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = applyRateLimit(request, `playlist-video-add:${user.id}`, { max: 30, windowMs: 60_000 });
  if (rateLimitError) {
    return rateLimitError;
  }

  const { playlistId } = await context.params;

  const playlist = await db.playlist.findFirst({
    where: {
      id: playlistId,
      userId: user.id,
    },
  });

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  const payload = await safeReadJson(request);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
  const parsed = addVideoSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const youtubeId = extractYouTubeId(parsed.data.youtubeUrl);
  if (!youtubeId) {
    return NextResponse.json({ error: "Invalid YouTube video URL" }, { status: 400 });
  }

  const existing = await db.video.findFirst({ where: { playlistId, youtubeId } });
  if (existing) {
    return NextResponse.json({ error: "This video already exists in the playlist" }, { status: 409 });
  }

  const metadata = await fetchYouTubeVideoMetadata([youtubeId]);
  const details = metadata.get(youtubeId);

  const maxOrder = await db.video.aggregate({
    where: { playlistId },
    _max: { order: true },
  });

  try {
    const createdVideo = await db.video.create({
      data: {
        playlistId,
        youtubeId,
        youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
        title: details?.title ?? "Untitled Video",
        duration: details?.duration && details.duration > 0 ? details.duration : 0,
        order: (maxOrder._max.order ?? 0) + 1,
        watchedSeconds: 0,
        isWatched: false,
      },
    });

    const progress = await syncPlaylistStats(playlistId);

    return NextResponse.json({ video: createdVideo, progress }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add video" }, { status: 500 });
  }
}
