import { NextResponse } from "next/server";
import { GoalMode } from "@prisma/client";

import { db } from "@/lib/db";
import {
  computeGoalValues,
  deriveTargetDaysFromDeadline,
  deriveTargetDaysFromMinutes,
  syncPlaylistStats,
} from "@/lib/progress";
import { applyRateLimit, enforceSameOrigin, safeReadJson } from "@/lib/security";
import { requireDbUser } from "@/lib/user";
import { goalSchema } from "@/lib/validators";

export async function PUT(request: Request, context: { params: Promise<{ playlistId: string }> }) {
  const user = await requireDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csrfError = enforceSameOrigin(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = applyRateLimit(request, `playlist-goal:${user.id}`, { max: 30, windowMs: 60_000 });
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
  const parsed = goalSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  let stats;
  try {
    stats = await syncPlaylistStats(playlistId);
  } catch {
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }

  let targetDays: number;
  let mode: GoalMode;
  let minutesPerDay: number | null = null;
  let deadline: Date | null = null;

  if (parsed.data.mode === "days") {
    mode = GoalMode.DAYS;
    targetDays = parsed.data.targetDays;
  } else if (parsed.data.mode === "minutes") {
    mode = GoalMode.MINUTES;
    minutesPerDay = parsed.data.minutesPerDay;
    targetDays = deriveTargetDaysFromMinutes(stats.totalVideos, stats.totalDuration, parsed.data.minutesPerDay);
  } else {
    mode = GoalMode.DEADLINE;
    deadline = new Date(parsed.data.deadline);
    targetDays = deriveTargetDaysFromDeadline(deadline);
  }

  const values = computeGoalValues(stats.totalVideos, stats.totalDuration, targetDays);

  try {
    const goal = await db.goal.upsert({
      where: { playlistId },
      create: {
        playlistId,
        mode,
        targetDays,
        minutesPerDay,
        deadline,
        videosPerDay: values.videosPerDay,
        estimatedDailyTime: values.estimatedDailyTime,
      },
      update: {
        mode,
        targetDays,
        minutesPerDay,
        deadline,
        videosPerDay: values.videosPerDay,
        estimatedDailyTime: values.estimatedDailyTime,
      },
    });

    return NextResponse.json(goal);
  } catch {
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}
