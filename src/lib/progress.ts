import { db } from "@/lib/db";

export function deriveTargetDaysFromMinutes(totalVideos: number, totalDuration: number, minutesPerDay: number) {
  const dailySeconds = Math.max(60, minutesPerDay * 60);
  if (totalDuration <= 0) {
    return Math.max(1, totalVideos);
  }

  return Math.max(1, Math.ceil(totalDuration / dailySeconds));
}

export function deriveTargetDaysFromDeadline(deadline: Date) {
  const now = new Date();
  const endOfDeadline = new Date(deadline);
  endOfDeadline.setHours(23, 59, 59, 999);

  const diffMs = endOfDeadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(1, diffDays);
}

export function computeGoalValues(totalVideos: number, totalDuration: number, targetDays: number) {
  return {
    videosPerDay: Math.max(1, Math.ceil(totalVideos / targetDays)),
    estimatedDailyTime: totalDuration > 0 ? Math.ceil(totalDuration / targetDays) : 0,
  };
}

export async function syncPlaylistStats(playlistId: string) {
  // Aggregate in SQL to avoid loading every video row into memory.
  const [aggregates, completedVideos, goal] = await db.$transaction([
    db.video.aggregate({
      where: { playlistId },
      _count: { _all: true },
      _sum: { duration: true },
    }),
    db.video.count({ where: { playlistId, isWatched: true } }),
    db.goal.findUnique({ where: { playlistId }, select: { targetDays: true } }),
  ]);

  const totalVideos = aggregates._count._all;
  const totalDuration = Math.max(0, aggregates._sum.duration ?? 0);
  const percentageCompleted = totalVideos === 0 ? 0 : Number(((completedVideos / totalVideos) * 100).toFixed(2));

  // Keep aggregate counters and progress in sync to avoid stale dashboard values.
  if (goal) {
    const computed = computeGoalValues(totalVideos, totalDuration, goal.targetDays);
    await db.$transaction([
      db.playlist.update({
        where: { id: playlistId },
        data: {
          totalVideos,
          totalDuration,
        },
      }),
      db.progress.upsert({
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
      }),
      db.goal.update({
        where: { playlistId },
        data: computed,
      }),
    ]);
  } else {
    await db.$transaction([
      db.playlist.update({
        where: { id: playlistId },
        data: {
          totalVideos,
          totalDuration,
        },
      }),
      db.progress.upsert({
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
      }),
    ]);
  }

  return {
    totalVideos,
    totalDuration,
    completedVideos,
    percentageCompleted,
  };
}
