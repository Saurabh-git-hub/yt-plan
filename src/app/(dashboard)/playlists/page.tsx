import { PlaylistsPageClient } from "../../../components/dashboard/playlists-page-client";
import { db } from "@/lib/db";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { requireDbUser } from "@/lib/user";

export default async function PlaylistsPage() {
	let user;
	try {
		user = await requireDbUser();
	} catch (error) {
		if (isDatabaseUnavailableError(error)) {
			return null;
		}
		throw error;
	}

	if (!user) {
		return null;
	}

	const playlists = await db.playlist.findMany({
		where: { userId: user.id },
		select: {
			id: true,
			title: true,
			totalVideos: true,
			totalDuration: true,
			progress: {
				select: {
					percentageCompleted: true,
				},
			},
			videos: {
				select: { youtubeId: true },
				orderBy: { order: "asc" },
				take: 1,
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	const completedCount = playlists.filter((playlist) => (playlist.progress?.percentageCompleted ?? 0) >= 100).length;

	const playlistCards = playlists.map((playlist) => ({
		id: playlist.id,
		title: playlist.title,
		totalVideos: playlist.totalVideos,
		totalDuration: playlist.totalDuration,
		percentageCompleted: playlist.progress?.percentageCompleted ?? 0,
		firstVideoYoutubeId: playlist.videos[0]?.youtubeId ?? null,
	}));

	return (
		<PlaylistsPageClient playlists={playlistCards} completedCount={completedCount} />
	);
}
