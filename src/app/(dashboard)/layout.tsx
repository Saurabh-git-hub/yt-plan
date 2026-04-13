import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireDbUser } from "@/lib/user";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  let dbUser;

  try {
    dbUser = await requireDbUser();
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_UNAVAILABLE") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-black px-6 text-zinc-100">
          <div className="w-full max-w-2xl rounded-2xl border border-rose-400/30 bg-zinc-900/70 p-6">
            <h1 className="text-2xl font-semibold text-rose-300">Database connection failed</h1>
            <p className="mt-3 text-sm text-zinc-300">
              App could not reach your Neon database right now. Verify network/DNS access and try again.
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Tip: if this worked earlier, your current DNS or network may be blocking Neon host resolution.
            </p>
          </div>
        </div>
      );
    }

    throw error;
  }

  if (!dbUser) {
    return null;
  }

  return <DashboardShell userEmail={dbUser.email}>{children}</DashboardShell>;
}
