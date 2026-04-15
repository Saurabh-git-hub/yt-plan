"use client";

import { useMemo, useRef, useState, useTransition } from "react";

import { ToastStack, type ToastItem } from "@/components/ui/toast-stack";

type FeedbackStatus = "OPEN" | "IN_REVIEW" | "RESOLVED";

interface FeedbackItem {
  id: string;
  subject: string;
  message: string;
  status: FeedbackStatus;
  adminReply: string;
  resolvedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: {
    email: string;
  };
}

interface FeedbackPageClientProps {
  initialFeedbacks: FeedbackItem[];
  isAdmin: boolean;
}

function formatDate(value: string | Date | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

function prettyStatus(status: FeedbackStatus) {
  if (status === "IN_REVIEW") {
    return "In Review";
  }

  if (status === "RESOLVED") {
    return "Resolved";
  }

  return "Open";
}

function statusClasses(status: FeedbackStatus) {
  if (status === "RESOLVED") {
    return "border-emerald-400/35 bg-emerald-400/15 text-emerald-300";
  }

  if (status === "IN_REVIEW") {
    return "border-lime-300/35 bg-lime-300/15 text-lime-200";
  }

  return "border-zinc-500/30 bg-zinc-500/15 text-zinc-300";
}

export function FeedbackPageClient({ initialFeedbacks, isAdmin }: FeedbackPageClientProps) {
  const [isPending, startTransition] = useTransition();
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdCounterRef = useRef(0);

  const [draftReplies, setDraftReplies] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const item of initialFeedbacks) {
      initial[item.id] = item.adminReply ?? "";
    }
    return initial;
  });

  const [draftStatuses, setDraftStatuses] = useState<Record<string, FeedbackStatus>>(() => {
    const initial: Record<string, FeedbackStatus> = {};
    for (const item of initialFeedbacks) {
      initial[item.id] = item.status;
    }
    return initial;
  });

  const totalOpen = useMemo(() => feedbacks.filter((item) => item.status !== "RESOLVED").length, [feedbacks]);

  const pushToast = (nextMessage: string, type: ToastItem["type"] = "info") => {
    toastIdCounterRef.current += 1;
    const id = `feedback-toast-${toastIdCounterRef.current}`;
    setToasts((prev) => [...prev, { id, message: nextMessage, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2800);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const onSubmitFeedback = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        pushToast(data.error ?? "Unable to submit feedback", "error");
        return;
      }

      const data = (await response.json()) as { feedback: Omit<FeedbackItem, "user"> };

      setFeedbacks((prev) => [
        {
          ...data.feedback,
          user: { email: "You" },
        },
        ...prev,
      ]);
      setDraftReplies((prev) => ({ ...prev, [data.feedback.id]: data.feedback.adminReply ?? "" }));
      setDraftStatuses((prev) => ({ ...prev, [data.feedback.id]: data.feedback.status }));
      setSubject("");
      setMessage("");
      pushToast("Feedback submitted", "success");
    });
  };

  const onAdminSave = (feedbackId: string) => {
    const nextStatus = draftStatuses[feedbackId] ?? "OPEN";
    const nextReply = (draftReplies[feedbackId] ?? "").trim();

    startTransition(async () => {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          adminReply: nextReply,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        pushToast(data.error ?? "Unable to update feedback", "error");
        return;
      }

      const data = (await response.json()) as {
        feedback: {
          id: string;
          status: FeedbackStatus;
          adminReply: string;
          resolvedAt: string | Date | null;
          updatedAt: string | Date;
        };
      };

      setFeedbacks((prev) =>
        prev.map((item) =>
          item.id === data.feedback.id
            ? {
                ...item,
                status: data.feedback.status,
                adminReply: data.feedback.adminReply,
                resolvedAt: data.feedback.resolvedAt,
                updatedAt: data.feedback.updatedAt,
              }
            : item,
        ),
      );
      pushToast("Reply/status updated", "success");
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[#101611] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.3)] md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-lime-200">Feedback Center</p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-50 md:text-5xl">
          {isAdmin ? "User Feedback Inbox" : "Share Feedback or Report Issues"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
          {isAdmin
            ? "Review all user reports, reply with fixes, and keep issue status transparent."
            : "Tell us what went wrong or what can be improved. You can track status and admin responses here."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3">
            <p className="text-xs text-zinc-500">Total feedback</p>
            <p className="mt-1 text-xl font-semibold text-white">{feedbacks.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3">
            <p className="text-xs text-zinc-500">Open / In review</p>
            <p className="mt-1 text-xl font-semibold text-white">{totalOpen}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3">
            <p className="text-xs text-zinc-500">Resolved</p>
            <p className="mt-1 text-xl font-semibold text-white">{feedbacks.length - totalOpen}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-zinc-100">Submit Feedback</h2>
        <p className="mt-1 text-sm text-zinc-500">Report bugs, login issues, playback problems, or feature suggestions.</p>

        <form onSubmit={onSubmitFeedback} className="mt-4 space-y-3">
          <div className="space-y-2">
            <label htmlFor="feedback-subject" className="text-sm text-zinc-300">Subject</label>
            <input
              id="feedback-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Example: Playback position resets unexpectedly"
              className="input-control h-11"
              maxLength={140}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="feedback-message" className="text-sm text-zinc-300">Message</label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Please describe what happened, steps to reproduce, and expected behavior."
              className="input-control min-h-28 resize-y py-3"
              maxLength={3000}
              required
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">{message.length}/3000</p>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100">{isAdmin ? "All User Feedback" : "My Feedback"}</h2>

        {feedbacks.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-zinc-400 backdrop-blur-xl">
            No feedback submitted yet.
          </p>
        ) : null}

        {feedbacks.map((item) => (
          <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(item.status)}`}>
                {prettyStatus(item.status).toUpperCase()}
              </span>
              <span className="text-xs text-zinc-500">Created: {formatDate(item.createdAt)}</span>
              {item.resolvedAt ? <span className="text-xs text-zinc-500">Resolved: {formatDate(item.resolvedAt)}</span> : null}
              {isAdmin ? <span className="rounded-full border border-white/15 px-2 py-1 text-xs text-zinc-300">{item.user.email}</span> : null}
            </div>

            <h3 className="text-base font-semibold text-zinc-100">{item.subject}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{item.message}</p>

            {!isAdmin && item.adminReply ? (
              <div className="mt-4 rounded-xl border border-lime-300/25 bg-lime-300/8 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-lime-200">Admin reply</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{item.adminReply}</p>
              </div>
            ) : null}

            {isAdmin ? (
              <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-[#0d1410] p-3">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-300">Status</label>
                  <select
                    value={draftStatuses[item.id] ?? item.status}
                    onChange={(event) =>
                      setDraftStatuses((prev) => ({
                        ...prev,
                        [item.id]: event.target.value as FeedbackStatus,
                      }))
                    }
                    className="input-control h-11"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-300">Reply</label>
                  <textarea
                    value={draftReplies[item.id] ?? ""}
                    onChange={(event) =>
                      setDraftReplies((prev) => ({
                        ...prev,
                        [item.id]: event.target.value,
                      }))
                    }
                    className="input-control min-h-24 resize-y py-3"
                    maxLength={3000}
                    placeholder="Write update for the user: fix status, workaround, expected timeline..."
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-zinc-500">Updated: {formatDate(item.updatedAt)}</p>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={isPending}
                    onClick={() => onAdminSave(item.id)}
                  >
                    {isPending ? "Saving..." : "Save Reply"}
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </section>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
