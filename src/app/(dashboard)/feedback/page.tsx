import { FeedbackPageClient } from "@/components/dashboard/feedback-page-client";
import { db } from "@/lib/db";
import { isAdminEmail, requireDbUser } from "@/lib/user";

export default async function FeedbackPage() {
  const user = await requireDbUser();
  if (!user) {
    return null;
  }

  const admin = isAdminEmail(user.email);

  const feedbacks = await db.feedback.findMany({
    where: admin ? undefined : { userId: user.id },
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

  return <FeedbackPageClient initialFeedbacks={feedbacks} isAdmin={admin} />;
}
