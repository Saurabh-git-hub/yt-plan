interface GoalCardProps {
  targetDays: number;
  videosPerDay: number;
  estimatedDailyTime: number;
  remainingVideos: number;
}

function formatDaily(seconds: number) {
  const mins = Math.ceil(seconds / 60);
  return `${mins} min/day`;
}

export function GoalCard({
  targetDays,
  videosPerDay,
  estimatedDailyTime,
  remainingVideos,
}: GoalCardProps) {
  return (
    <div className="rounded-2xl border border-lime-300/20 bg-[#101611] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.2em] text-lime-200">Daily Plan</p>
      <h3 className="mt-2 text-xl font-semibold text-zinc-100">Watch {videosPerDay} videos today</h3>
      <p className="mt-2 text-sm text-zinc-300">
        Finish in {targetDays} days, about {formatDaily(estimatedDailyTime)}.
      </p>
      <p className="mt-3 text-sm text-zinc-400">Remaining videos: {remainingVideos}</p>
    </div>
  );
}
