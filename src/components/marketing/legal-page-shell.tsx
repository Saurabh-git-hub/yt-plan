import type { ReactNode } from "react";
import Link from "next/link";

import { PlanYtLogo } from "@/components/brand/planyt-logo";

export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden pb-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-18%,rgba(177,255,69,0.2),transparent_44%),radial-gradient(circle_at_12%_92%,rgba(115,255,165,0.12),transparent_38%),linear-gradient(180deg,#0b0f0c_0%,#080b09_100%)]" />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0b0f0c]/85 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
          <PlanYtLogo />
          <Link
            href="/"
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 transition hover:border-lime-300/50"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 pb-20 pt-28">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl md:p-10">
          <p className="text-xs tracking-[0.2em] text-lime-200">LEGAL</p>
          <h1 className="mt-3 text-3xl font-semibold text-white md:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-zinc-400">Last updated: {lastUpdated}</p>

          <div className="mt-8 space-y-8 text-zinc-300">{children}</div>
        </section>
      </main>
    </div>
  );
}
