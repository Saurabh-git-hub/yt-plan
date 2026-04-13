import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { syncPlaylistStats } from "@/lib/progress";
import { applyRateLimit, enforceSameOrigin, safeReadJson } from "@/lib/security";
import { requireDbUser } from "@/lib/user";
import { updatePlaylistSchema } from "@/lib/validators";

async function getOwnedPlaylist(playlistId: string, userId: string) {
  return db.playlist.findFirst({
    where: {
      id: playlistId,
      userId,
    },
    include: {
      videos: {
        orderBy: { order: "asc" },
      },
      progress: true,
      goal: true,
    },
  });
}

export async function GET(_: Request, context: { params: Promise<{ playlistId: string }> }) {
  const user = await requireDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playlistId } = await context.params;
  const playlist = await db.playlist.findFirst({
    where: { id: playlistId, userId: user.id },
    select: { id: true },
  });

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  try {
    await syncPlaylistStats(playlistId);
    const refreshed = await getOwnedPlaylist(playlistId, user.id);

    return NextResponse.json(refreshed);
  } catch {
    return NextResponse.json({ error: "Failed to load playlist" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ playlistId: string }> }) {
  const user = await requireDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csrfError = enforceSameOrigin(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = applyRateLimit(request, `playlist-update:${user.id}`, { max: 40, windowMs: 60_000 });
  if (rateLimitError) {
    return rateLimitError;
  }

  const { playlistId } = await context.params;
  const playlist = await db.playlist.findFirst({ where: { id: playlistId, userId: user.id } });

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  const payload = await safeReadJson(request);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = updatePlaylistSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  try {
    const updated = await db.playlist.update({
      where: { id: playlistId },
      data: { title: parsed.data.title },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ playlistId: string }> }) {
  const user = await requireDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csrfError = enforceSameOrigin(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = applyRateLimit(request, `playlist-delete:${user.id}`, { max: 20, windowMs: 60_000 });
  if (rateLimitError) {
    return rateLimitError;
  }

  const { playlistId } = await context.params;
  const playlist = await db.playlist.findFirst({ where: { id: playlistId, userId: user.id } });

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  try {
    await db.playlist.delete({ where: { id: playlistId } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete playlist" }, { status: 500 });
  }
}
