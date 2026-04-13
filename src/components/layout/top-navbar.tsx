"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

import { PlanYtLogo } from "@/components/brand/planyt-logo";

function getDisplayNameFromEmail(email: string) {
  const localPart = email.split("@")[0]?.trim();
  return localPart && localPart.length > 0 ? localPart : "User";
}

export function TopNavbar({ userEmail }: { userEmail: string }) {
  const { user } = useUser();

  const fallbackFromEmail = getDisplayNameFromEmail(userEmail);
  const profileName = user?.username?.trim() || user?.fullName?.trim() || user?.firstName?.trim();
  const userName = profileName && profileName.length > 0 ? profileName : fallbackFromEmail;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d1410]/90 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="md:hidden">
            <PlanYtLogo className="text-base sm:text-lg" />
          </div>
          <nav className="hidden items-center gap-2 text-sm text-zinc-400 max-md:flex">
            <Link href="/dashboard" className="rounded-md px-2 py-1 hover:bg-white/[0.07] hover:text-zinc-100">
              Dashboard
            </Link>
            <Link href="/playlists" className="rounded-md px-2 py-1 hover:bg-white/[0.07] hover:text-zinc-100">
              Playlists
            </Link>
          </nav>
          <p className="hidden text-xs uppercase tracking-[0.25em] text-lime-200 sm:block">Welcome</p>
          <p className="truncate text-sm text-zinc-400">{userName}</p>
        </div>
        <UserButton />
      </div>
    </header>
  );
}
