-- Add playlist sharing support
ALTER TABLE "Playlist"
ADD COLUMN "isShared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "shareToken" TEXT;

CREATE UNIQUE INDEX "Playlist_shareToken_key" ON "Playlist"("shareToken");
