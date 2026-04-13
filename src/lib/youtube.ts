export function extractYouTubeId(url: string): string | null {
  const trimmed = url.trim();

  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;

    const getPathSegment = (index: number) => {
      const segments = pathname.split("/").filter(Boolean);
      return segments[index] ?? null;
    };

    let candidate: string | null = null;

    if (host === "youtu.be") {
      candidate = getPathSegment(0);
    } else if (host.includes("youtube.com") || host.includes("youtube-nocookie.com")) {
      candidate = parsed.searchParams.get("v");

      if (!candidate && pathname.startsWith("/embed/")) {
        candidate = getPathSegment(1);
      }

      if (!candidate && pathname.startsWith("/shorts/")) {
        candidate = getPathSegment(1);
      }

      if (!candidate && pathname.startsWith("/live/")) {
        candidate = getPathSegment(1);
      }

      if (!candidate && pathname === "/attribution_link") {
        const nestedUrl = parsed.searchParams.get("u");
        if (nestedUrl) {
          return extractYouTubeId(`https://www.youtube.com${nestedUrl}`);
        }
      }
    }

    if (candidate && /^[A-Za-z0-9_-]{11}$/.test(candidate)) {
      return candidate;
    }
  } catch {
    // Fall through to regex parsing.
  }

  // Support the most common public YouTube URL variants.
  const patterns = [
    /(?:youtube\.com\/watch\?.*?[?&]v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export function toEmbedUrl(youtubeId: string) {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?enablejsapi=1`;
}

export function extractYouTubePlaylistId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();
    const listId = parsed.searchParams.get("list")?.trim();

    if (!listId) {
      return null;
    }

    if (host.includes("youtube.com") || host === "youtu.be" || host.includes("youtube-nocookie.com")) {
      return listId;
    }

    return null;
  } catch {
    return null;
  }
}

export function isPlaceholderVideoTitle(title: string) {
  return /^Video\s+\d+$/i.test(title.trim());
}

async function fetchWithTimeout(input: string, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchYouTubeDurationsFromWatchPages(videoIds: string[]) {
  const result = new Map<string, number>();

  await Promise.all(
    videoIds.map(async (videoId) => {
      try {
        const endpoint = `https://www.youtube.com/watch?v=${videoId}&hl=en`;
        const response = await fetchWithTimeout(endpoint, 4000);
        if (!response.ok) {
          return;
        }

        const html = await response.text();
        const lengthSecondsMatch = html.match(/"lengthSeconds":"(\d+)"/);
        const seconds = Number(lengthSecondsMatch?.[1] ?? 0);

        if (Number.isFinite(seconds) && seconds > 0) {
          result.set(videoId, Math.floor(seconds));
        }
      } catch {
        // Ignore fallback duration errors and keep existing duration.
      }
    }),
  );

  return result;
}

export async function fetchYouTubeTitlesFromOEmbed(videoIds: string[]) {
  const result = new Map<string, string>();

  await Promise.all(
    videoIds.map(async (videoId) => {
      try {
        const endpoint = new URL("https://www.youtube.com/oembed");
        endpoint.searchParams.set("url", `https://www.youtube.com/watch?v=${videoId}`);
        endpoint.searchParams.set("format", "json");

        const response = await fetchWithTimeout(endpoint.toString(), 3000);
        if (!response.ok) {
          return;
        }

        const json = (await response.json()) as { title?: string };
        if (json.title && json.title.trim().length > 0) {
          result.set(videoId, json.title.trim());
        }
      } catch {
        // Ignore fallback title errors and keep existing title.
      }
    }),
  );

  return result;
}

export function parseYouTubeDurationToSeconds(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    return 0;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function fetchYouTubeVideoMetadata(videoIds: string[]) {
  const metadata = new Map<string, { title: string; duration: number }>();

  if (videoIds.length === 0) {
    return metadata;
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");
      endpoint.searchParams.set("part", "contentDetails,snippet");
      endpoint.searchParams.set("id", batch.join(","));
      endpoint.searchParams.set("key", apiKey);

      let response: Response;
      try {
        response = await fetchWithTimeout(endpoint.toString(), 4500);
      } catch {
        // Keep playlist creation resilient when YouTube API is slow/unavailable.
        continue;
      }

      if (!response.ok) {
        continue;
      }

      const json = (await response.json()) as {
        items?: Array<{
          id: string;
          snippet?: { title?: string };
          contentDetails?: { duration?: string };
        }>;
      };

      for (const item of json.items ?? []) {
        metadata.set(item.id, {
          title: item.snippet?.title ?? "Untitled Video",
          duration: parseYouTubeDurationToSeconds(item.contentDetails?.duration ?? "PT0S"),
        });
      }
    }
  }

  const missingTitleIds = videoIds.filter((id) => {
    const details = metadata.get(id);
    return !details || !details.title || details.title === "Untitled Video";
  });
  if (missingTitleIds.length > 0) {
    const fallbackTitles = await fetchYouTubeTitlesFromOEmbed(missingTitleIds);
    for (const id of missingTitleIds) {
      const existing = metadata.get(id);
      const fallbackTitle = fallbackTitles.get(id);

      if (!existing && fallbackTitle) {
        metadata.set(id, { title: fallbackTitle, duration: 0 });
      } else if (existing && fallbackTitle && (!existing.title || existing.title === "Untitled Video")) {
        metadata.set(id, { ...existing, title: fallbackTitle });
      }
    }
  }

  const missingDurationIds = videoIds.filter((id) => {
    const details = metadata.get(id);
    return !details || !details.duration || details.duration <= 0;
  });

  if (missingDurationIds.length > 0) {
    const fallbackDurations = await fetchYouTubeDurationsFromWatchPages(missingDurationIds);

    for (const id of missingDurationIds) {
      const seconds = fallbackDurations.get(id);
      if (!seconds || seconds <= 0) {
        continue;
      }

      const existing = metadata.get(id);
      if (existing) {
        metadata.set(id, {
          ...existing,
          duration: seconds,
        });
      } else {
        metadata.set(id, {
          title: "Untitled Video",
          duration: seconds,
        });
      }
    }
  }

  return metadata;
}

export async function fetchYouTubePlaylistVideoIds(playlistId: string) {
  const rssFallback = async () => {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;

    let response: Response;
    try {
      response = await fetch(feedUrl, { cache: "no-store" });
    } catch {
      return [];
    }
    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    const matches = Array.from(xml.matchAll(/<yt:videoId>([A-Za-z0-9_-]{11})<\/yt:videoId>/g));

    return matches
      .map((match) => match[1])
      .filter((id, index, array) => array.indexOf(id) === index);
  };

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return rssFallback();
  }

  const result: string[] = [];
  let nextPageToken: string | null = null;

  do {
    const endpoint = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    endpoint.searchParams.set("part", "snippet");
    endpoint.searchParams.set("playlistId", playlistId);
    endpoint.searchParams.set("maxResults", "50");
    endpoint.searchParams.set("key", apiKey);

    if (nextPageToken) {
      endpoint.searchParams.set("pageToken", nextPageToken);
    }

    let response: Response;
    try {
      response = await fetchWithTimeout(endpoint.toString(), 6000);
    } catch {
      return rssFallback();
    }

    if (!response.ok) {
      return rssFallback();
    }

    const json = (await response.json()) as {
      nextPageToken?: string;
      items?: Array<{
        snippet?: {
          resourceId?: {
            videoId?: string;
          };
        };
      }>;
    };

    for (const item of json.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId;
      if (videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        result.push(videoId);
      }
    }

    nextPageToken = json.nextPageToken ?? null;
  } while (nextPageToken);

  if (result.length > 0) {
    return result;
  }

  return rssFallback();
}
