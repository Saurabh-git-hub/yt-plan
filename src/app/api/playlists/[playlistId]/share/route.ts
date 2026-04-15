import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { applyRateLimit, enforceSameOrigin } from "@/lib/security";
import { requireDbUser } from "@/lib/user";

function generateShareToken() {
  return randomBytes(18)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function GET(_: Request, context: { params: Promise<{ playlistId: string }> }) {
  const user = await requireDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playlistId } = await context.params;

  const playlist = await db.playlist.findFirst({
    where: { id: playlistId, userId: user.id },
    select: { isShared: true, shareToken: true },
  });

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  return NextResponse.json({
    isShared: playlist.isShared,
    shareToken: playlist.shareToken,
    sharePath: playlist.isShared && playlist.shareToken ? `/shared/${playlist.shareToken}` : null,
  });
}

export async function POST(request: Request, context: { params: Promise<{ playlistId: string }> }) {
  const user = await requireDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csrfError = enforceSameOrigin(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = applyRateLimit(request, `playlist-share:${user.id}`, { max: 30, windowMs: 60_000 });
  if (rateLimitError) {
    return rateLimitError;
  }

  const { playlistId } = await context.params;

  const playlist = await db.playlist.findFirst({
    where: { id: playlistId, userId: user.id },
    select: { id: true, isShared: true, shareToken: true },
  });

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  if (playlist.isShared && playlist.shareToken) {
    return NextResponse.json({
      isShared: true,
      shareToken: playlist.shareToken,
      sharePath: `/shared/${playlist.shareToken}`,
    });
  }

  let updatedToken: string | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidate = generateShareToken();

    try {
      const updated = await db.playlist.update({
        where: { id: playlist.id },
        data: {
          isShared: true,
          shareToken: candidate,
        },
        select: { shareToken: true },
      });

      updatedToken = updated.shareToken;
      break;
    } catch {
      // Retry in case of a rare unique token collision.
    }
  }

  if (!updatedToken) {
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }

  return NextResponse.json({
    isShared: true,
    shareToken: updatedToken,
    sharePath: `/shared/${updatedToken}`,
  });
}
