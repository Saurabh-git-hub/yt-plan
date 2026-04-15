import { FeedbackStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isAdminEmail, requireDbUser } from "@/lib/user";

export async function GET() {
  const user = await requireDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const count = await db.feedback.count({
      where: {
        status: {
          in: [FeedbackStatus.OPEN, FeedbackStatus.IN_REVIEW],
        },
      },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ error: "Failed to load unread feedback count" }, { status: 500 });
  }
}
