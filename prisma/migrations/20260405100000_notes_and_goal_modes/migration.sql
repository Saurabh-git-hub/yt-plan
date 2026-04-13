-- CreateEnum
CREATE TYPE "public"."GoalMode" AS ENUM ('DAYS', 'MINUTES', 'DEADLINE');

-- AlterTable
ALTER TABLE "public"."Video" ADD COLUMN "notes" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "public"."Goal"
  ADD COLUMN "mode" "public"."GoalMode" NOT NULL DEFAULT 'DAYS',
  ADD COLUMN "minutesPerDay" INTEGER,
  ADD COLUMN "deadline" TIMESTAMP(3);
