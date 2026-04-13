import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { syncPlaylistStats } from "@/lib/progress";
import { applyRateLimit, enforceSameOrigin, safeReadJson } from "@/lib/security";
import { requireDbUser } from "@/lib/user";
import { createPlaylistSchema } from "@/lib/validators";
import {
  extractYouTubePlaylistId,
  extractYouTubeId,
  fetchYouTubePlaylistVideoIds,
  fetchYouTubeVideoMetadata,
} from "@/lib/youtube";

export async function GET() {
  let user;
  try {
    user = await requireDbUser();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    throw error;
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const playlists = await db.playlist.findMany({
      where: { userId: user.id },
      include: {
        progress: true,
        goal: true,
        videos: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(playlists);
  } catch {
    return NextResponse.json({ error: "Failed to load playlists" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireDbUser();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    throw error;
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csrfError = enforceSameOrigin(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = applyRateLimit(request, `playlist-create:${user.id}`, { max: 15, windowMs: 60_000 });
  if (rateLimitError) {
    return rateLimitError;
  }

  const payload = await safeReadJson(request);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = createPlaylistSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const links = parsed.data.links;
  const expandedVideoIds: string[] = [];

  for (const link of links) {
    const youtubeId = extractYouTubeId(link);
    if (youtubeId) {
      expandedVideoIds.push(youtubeId);
      continue;
    }

    const playlistSourceId = extractYouTubePlaylistId(link);
    if (!playlistSourceId) {
      return NextResponse.json(
        {
          error: "One or more YouTube links are invalid.",
        },
        { status: 400 },
      );
    }

    const playlistVideoIds = await fetchYouTubePlaylistVideoIds(playlistSourceId);
    if (playlistVideoIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not load videos from a playlist URL. Add a YouTube API key or paste direct video links.",
        },
        { status: 400 },
      );
    }

    expandedVideoIds.push(...playlistVideoIds);
  }

  const dedupedVideoIds = expandedVideoIds.filter((id, index) => expandedVideoIds.indexOf(id) === index);
  if (dedupedVideoIds.length === 0) {
    return NextResponse.json({ error: "No valid YouTube videos were found." }, { status: 400 });
  }

  const validVideos = dedupedVideoIds.map((youtubeId, index) => ({
    fallbackTitle: `Video ${index + 1}`,
    youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    youtubeId,
    order: index + 1,
  }));

  const metadata = await fetchYouTubeVideoMetadata(validVideos.map((video) => video.youtubeId));

  const videos = validVideos.map((video) => {
    const details = metadata.get(video.youtubeId);
    return {
      title: details?.title ?? video.fallbackTitle,
      youtubeUrl: video.youtubeUrl,
      youtubeId: video.youtubeId,
      order: video.order,
      duration: details?.duration && details.duration > 0 ? details.duration : 0,
    };
  });

  try {
    const playlist = await db.playlist.create({
      data: {
        title: parsed.data.title,
        userId: user.id,
        videos: {
          create: videos,
        },
        progress: {
          create: {
            completedVideos: 0,
            percentageCompleted: 0,
          },
        },
      },
    });

    await syncPlaylistStats(playlist.id);

    return NextResponse.json(playlist, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 });
  }
}
