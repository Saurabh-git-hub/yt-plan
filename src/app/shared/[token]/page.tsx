import { notFound } from "next/navigation";

import { SharedPlaylistView } from "@/components/playlist/shared-playlist-view";
import { db } from "@/lib/db";

export default async function SharedPlaylistPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const playlist = await db.playlist.findFirst({
    where: {
      shareToken: token,
      isShared: true,
    },
    select: {
      title: true,
      user: {
        select: {
          email: true,
        },
      },
      videos: {
        select: {
          id: true,
          title: true,
          youtubeId: true,
          duration: true,
          order: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!playlist) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#060b08] px-4 py-8 text-zinc-100 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <SharedPlaylistView
          title={playlist.title}
          ownerLabel={playlist.user.email}
          videos={playlist.videos}
        />
      </div>
    </main>
  );
}
