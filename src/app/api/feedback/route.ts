import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { applyRateLimit, enforceSameOrigin, safeReadJson } from "@/lib/security";
import { isAdminEmail, requireDbUser } from "@/lib/user";
import { createFeedbackSchema } from "@/lib/validators";

export async function GET() {
  const user = await requireDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const isAdmin = isAdminEmail(user.email);
    const feedbacks = await db.feedback.findMany({
      where: isAdmin ? undefined : { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subject: true,
        message: true,
        status: true,
        adminReply: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ feedbacks, isAdmin });
  } catch {
    return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csrfError = enforceSameOrigin(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = applyRateLimit(request, `feedback-create:${user.id}`, { max: 25, windowMs: 60_000 });
  if (rateLimitError) {
    return rateLimitError;
  }

  const payload = await safeReadJson(request);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = createFeedbackSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  try {
    const feedback = await db.feedback.create({
      data: {
        userId: user.id,
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
      select: {
        id: true,
        subject: true,
        message: true,
        status: true,
        adminReply: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
