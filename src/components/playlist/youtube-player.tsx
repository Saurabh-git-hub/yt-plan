"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, number>;
          events?: {
            onReady?: (event: { target: YouTubePlayerApi }) => void;
            onStateChange?: (event: { data: number }) => void;
          };
        },
      ) => YouTubePlayerApi;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayerApi {
  destroy: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
}

const PLAYER_STATE_ENDED = 0;
const PLAYER_STATE_PLAYING = 1;
const TRACK_INTERVAL_MS = 1000;
const SYNC_INTERVAL_MS = 5000;
const DURATION_DISCOVERY_INTERVAL_MS = 400;
const DURATION_DISCOVERY_TIMEOUT_MS = 12_000;

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);

    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };
  });

  return youtubeApiPromise;
}

interface YouTubePlayerProps {
  youtubeId: string;
  playlistId: string;
  videoId: string;
  initialWatchedSeconds: number;
  initialIsWatched: boolean;
  autoPlayEnabled?: boolean;
  onTrack: (data: {
    watchedSeconds: number;
    isWatched?: boolean;
    percentageCompleted?: number;
    durationSeconds?: number;
  }) => void;
  onSyncEvent?: (data: { watchedSeconds: number; isWatched: boolean }) => void;
  onVideoEnded?: () => void;
}

export function YouTubePlayer({
  youtubeId,
  playlistId,
  videoId,
  initialWatchedSeconds,
  initialIsWatched,
  autoPlayEnabled = false,
  onTrack,
  onSyncEvent,
  onVideoEnded,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayerApi | null>(null);
  const intervalRef = useRef<number | null>(null);
  const durationDiscoveryRef = useRef<number | null>(null);
  const metadataWarmupTimerRef = useRef<number | null>(null);
  const initialSeekRef = useRef<number>(Math.floor(initialWatchedSeconds));
  const initialIsWatchedRef = useRef<boolean>(initialIsWatched);
  const lastSyncedSecondRef = useRef<number>(Math.floor(initialWatchedSeconds));
  const watchedSecondsRef = useRef<number>(Math.floor(initialWatchedSeconds));
  const lastSyncedAtRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);
  const isWatchedRef = useRef<boolean>(initialIsWatched);
  const hasSyncedDurationRef = useRef<boolean>(false);
  const hasStartedPlaybackRef = useRef<boolean>(false);
  const endedHandledRef = useRef<boolean>(false);
  const onTrackRef = useRef(onTrack);
  const onSyncEventRef = useRef(onSyncEvent);
  const onVideoEndedRef = useRef(onVideoEnded);
  const autoPlayEnabledRef = useRef(autoPlayEnabled);

  useEffect(() => {
    onTrackRef.current = onTrack;
  }, [onTrack]);

  useEffect(() => {
    onSyncEventRef.current = onSyncEvent;
  }, [onSyncEvent]);

  useEffect(() => {
    onVideoEndedRef.current = onVideoEnded;
  }, [onVideoEnded]);

  useEffect(() => {
    autoPlayEnabledRef.current = autoPlayEnabled;
  }, [autoPlayEnabled]);

  useEffect(() => {
    isWatchedRef.current = initialIsWatched;
  }, [initialIsWatched]);

  useEffect(() => {
    let isUnmounted = false;

    const clearDurationDiscovery = () => {
      if (!durationDiscoveryRef.current) {
        return;
      }

      window.clearInterval(durationDiscoveryRef.current);
      durationDiscoveryRef.current = null;
    };

    const clearMetadataWarmupTimer = () => {
      if (!metadataWarmupTimerRef.current) {
        return;
      }

      window.clearTimeout(metadataWarmupTimerRef.current);
      metadataWarmupTimerRef.current = null;
    };

    const warmupDurationDiscovery = () => {
      if (autoPlayEnabledRef.current) {
        return;
      }

      const player = playerRef.current;
      if (!player) {
        return;
      }

      try {
        player.mute();
        player.playVideo();

        clearMetadataWarmupTimer();
        metadataWarmupTimerRef.current = window.setTimeout(() => {
          try {
            player.pauseVideo();
            player.unMute();
          } catch {
            // Best-effort cleanup only.
          }

          void trySyncDuration();
        }, 600);
      } catch {
        // Ignore warmup errors; normal duration discovery continues.
      }
    };

    const syncPosition = async (force = false) => {
      const player = playerRef.current;
      if (!player) {
        return;
      }

      // Prevent overlapping PATCH requests when interval ticks and state changes race.
      if (isSyncingRef.current) {
        return;
      }

      const watchedSeconds = Math.floor(watchedSecondsRef.current);
      if (!force && watchedSeconds <= lastSyncedSecondRef.current) {
        return;
      }

      const durationSeconds = Math.max(0, Math.floor(player.getDuration()));

      lastSyncedSecondRef.current = watchedSeconds;

      isSyncingRef.current = true;

      try {
        const response = await fetch(`/api/playlists/${playlistId}/videos/${videoId}/position`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchedSeconds, durationSeconds }),
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          video: { isWatched: boolean; watchedSeconds: number; duration: number };
          progress: { percentageCompleted: number };
        };

        isWatchedRef.current = data.video.isWatched;
        watchedSecondsRef.current = data.video.watchedSeconds;

        onTrackRef.current({
          isWatched: data.video.isWatched,
          watchedSeconds: data.video.watchedSeconds,
          percentageCompleted: data.progress.percentageCompleted,
          durationSeconds: data.video.duration,
        });

        onSyncEventRef.current?.({
          watchedSeconds: data.video.watchedSeconds,
          isWatched: data.video.isWatched,
        });
      } finally {
        isSyncingRef.current = false;
      }
    };

    const trySyncDuration = async () => {
      if (hasSyncedDurationRef.current) {
        return true;
      }

      const player = playerRef.current;
      if (!player) {
        return false;
      }

      const durationSeconds = Math.max(0, Math.ceil(player.getDuration()));
      if (durationSeconds <= 0) {
        return false;
      }

      hasSyncedDurationRef.current = true;
      onTrackRef.current({
        watchedSeconds: watchedSecondsRef.current,
        isWatched: isWatchedRef.current,
        durationSeconds,
      });
      await syncPosition(true);
      return true;
    };

    const trackWatchTime = async () => {
      const player = playerRef.current;
      if (!player) {
        return;
      }

      const now = Date.now();
      const currentSecond = Math.floor(player.getCurrentTime());
      const duration = Math.max(0, Math.floor(player.getDuration()));

      if (duration > 0) {
        watchedSecondsRef.current = Math.min(currentSecond, duration);
      } else {
        watchedSecondsRef.current = Math.max(0, currentSecond);
      }

      if (duration > 0 && !hasSyncedDurationRef.current) {
        await trySyncDuration();
      }

      if (now - lastSyncedAtRef.current >= SYNC_INTERVAL_MS) {
        lastSyncedAtRef.current = now;
        await syncPosition();
      }
    };

    loadYouTubeApi().then(() => {
      if (isUnmounted || !containerRef.current || !window.YT?.Player) {
        return;
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: youtubeId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            const duration = Math.max(0, Math.ceil(event.target.getDuration()));
            hasSyncedDurationRef.current = false;
            hasStartedPlaybackRef.current = false;
            endedHandledRef.current = false;

            if (initialIsWatchedRef.current && duration > 0) {
              const endPosition = Math.max(0, duration - 1);
              event.target.seekTo(endPosition, true);
              watchedSecondsRef.current = duration;
              lastSyncedSecondRef.current = duration;
            } else if (initialSeekRef.current > 0) {
              event.target.seekTo(initialSeekRef.current, true);
              watchedSecondsRef.current = Math.floor(initialSeekRef.current);
            } else {
              watchedSecondsRef.current = Math.floor(event.target.getCurrentTime());
            }

            if (duration > 0) {
              void trySyncDuration();
            } else {
              const startedAt = Date.now();
              clearDurationDiscovery();
              durationDiscoveryRef.current = window.setInterval(() => {
                if (Date.now() - startedAt >= DURATION_DISCOVERY_TIMEOUT_MS) {
                  clearDurationDiscovery();
                  return;
                }

                void trySyncDuration().then((synced) => {
                  if (synced) {
                    clearDurationDiscovery();
                  }
                });
              }, DURATION_DISCOVERY_INTERVAL_MS);

              // Some videos expose duration only after playback starts once.
              warmupDurationDiscovery();
            }

            if (autoPlayEnabledRef.current) {
              event.target.playVideo();
            }

            lastSyncedAtRef.current = Date.now();
          },
          onStateChange: (event) => {
            if (event.data === PLAYER_STATE_PLAYING) {
              hasStartedPlaybackRef.current = true;
              endedHandledRef.current = false;

              if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
              }

              intervalRef.current = window.setInterval(() => {
                void trackWatchTime();
              }, TRACK_INTERVAL_MS);
            } else {
              if (event.data === PLAYER_STATE_ENDED) {
                const duration = Math.max(0, Math.ceil(playerRef.current?.getDuration() ?? 0));
                if (duration > 0) {
                  watchedSecondsRef.current = duration;
                }
                void syncPosition(true);

                if (!endedHandledRef.current && hasStartedPlaybackRef.current && autoPlayEnabledRef.current) {
                  endedHandledRef.current = true;
                  onVideoEndedRef.current?.();
                }
              }

              if (!intervalRef.current) {
                return;
              }

              window.clearInterval(intervalRef.current);
              intervalRef.current = null;

              watchedSecondsRef.current = Math.floor(playerRef.current?.getCurrentTime() ?? watchedSecondsRef.current);
              void syncPosition();
            }
          },
        },
      });
    });

    return () => {
      isUnmounted = true;
      clearDurationDiscovery();
      clearMetadataWarmupTimer();
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      void syncPosition(true);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [playlistId, videoId, youtubeId]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111712]/80 backdrop-blur-xl">
      <div ref={containerRef} className="aspect-video w-full" />
    </div>
  );
}
