import { z } from "zod";

import { sanitizePlainText } from "@/lib/security";

export const createPlaylistSchema = z.object({
  title: z
    .string()
    .transform((value) => sanitizePlainText(value, 120))
    .pipe(z.string().min(2, "Title must be at least 2 characters").max(120)),
  links: z.array(z.string().url("Each item must be a valid URL")).min(1),
});

export const updatePlaylistSchema = z.object({
  title: z
    .string()
    .transform((value) => sanitizePlainText(value, 120))
    .pipe(z.string().min(2, "Title must be at least 2 characters").max(120)),
});

export const addVideoSchema = z.object({
  youtubeUrl: z.string().url("Please enter a valid YouTube URL"),
});

export const updateVideoSchema = z
  .object({
    isWatched: z.boolean().optional(),
    notes: z
      .string()
      .transform((value) => sanitizePlainText(value, 5000))
      .pipe(z.string().max(5000, "Notes cannot exceed 5000 characters"))
      .optional(),
  })
  .refine((data) => typeof data.isWatched === "boolean" || typeof data.notes === "string", {
    message: "At least one field must be provided",
  });

export const goalSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("days"),
    targetDays: z.number().int().min(1).max(3650),
  }),
  z.object({
    mode: z.literal("minutes"),
    minutesPerDay: z.number().int().min(1).max(720),
  }),
  z.object({
    mode: z.literal("deadline"),
    deadline: z.string().date(),
  }),
]);

export const reorderVideosSchema = z.object({
  videoIds: z.array(z.string().min(1)).min(1),
});

export const videoPositionSchema = z.object({
  watchedSeconds: z.number().min(0),
  durationSeconds: z.number().int().min(0).optional(),
});
