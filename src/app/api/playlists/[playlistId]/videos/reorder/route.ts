import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { applyRateLimit, enforceSameOrigin, safeReadJson } from "@/lib/security";
import { requireDbUser } from "@/lib/user";
import { reorderVideosSchema } from "@/lib/validators";

export async function PATCH(request: Request, context: { params: Promise<{ playlistId: string }> }) {
  const user = await requireDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csrfError = enforceSameOrigin(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = applyRateLimit(request, `playlist-video-reorder:${user.id}`, { max: 80, windowMs: 60_000 });
  if (rateLimitError) {
    return rateLimitError;
  }

  const { playlistId } = await context.params;
  const playlist = await db.playlist.findFirst({
    where: {
      id: playlistId,
      userId: user.id,
    },
    include: {
      videos: {
        select: { id: true },
      },
    },
  });

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  const payload = await safeReadJson(request);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
  const parsed = reorderVideosSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const existingIds = new Set(playlist.videos.map((video) => video.id));
  const providedIds = parsed.data.videoIds;

  if (providedIds.length !== playlist.videos.length) {
    return NextResponse.json({ error: "Invalid video list length" }, { status: 400 });
  }

  const uniqueProvided = new Set(providedIds);
  if (uniqueProvided.size !== providedIds.length) {
    return NextResponse.json({ error: "Duplicate video ids are not allowed" }, { status: 400 });
  }

  if (!providedIds.every((id) => existingIds.has(id))) {
    return NextResponse.json({ error: "One or more video ids do not belong to this playlist" }, { status: 400 });
  }

  try {
    await db.$transaction(
      providedIds.map((videoId, index) =>
        db.video.update({
          where: { id: videoId },
          data: { order: index + 1 },
        }),
      ),
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to reorder videos" }, { status: 500 });
  }
}
