import { FeedbackStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { applyRateLimit, enforceSameOrigin, safeReadJson } from "@/lib/security";
import { isAdminEmail, requireDbUser } from "@/lib/user";
import { updateFeedbackSchema } from "@/lib/validators";

export async function PATCH(request: Request, context: { params: Promise<{ feedbackId: string }> }) {
  const user = await requireDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const csrfError = enforceSameOrigin(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = applyRateLimit(request, `feedback-admin-update:${user.id}`, { max: 120, windowMs: 60_000 });
  if (rateLimitError) {
    return rateLimitError;
  }

  const payload = await safeReadJson(request);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = updateFeedbackSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { feedbackId } = await context.params;

  try {
    const feedback = await db.feedback.update({
      where: { id: feedbackId },
      data: {
        status: parsed.data.status,
        adminReply: parsed.data.adminReply,
        resolvedAt: parsed.data.status === FeedbackStatus.RESOLVED ? new Date() : null,
      },
      select: {
        id: true,
        status: true,
        adminReply: true,
        resolvedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ feedback });
  } catch {
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
  }
}
