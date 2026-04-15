"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { BookOpenCheck, House, Menu, MessageSquareText, PanelLeftClose, X } from "lucide-react";

import { PlanYtLogo } from "@/components/brand/planyt-logo";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/playlists", label: "Playlists", icon: BookOpenCheck },
  { href: "/feedback", label: "Feedback", icon: MessageSquareText },
];

const ADMIN_EMAIL = "saurabh20002004@gmail.com";

function getDisplayNameFromEmail(email: string) {
  const localPart = email.split("@")[0]?.trim();
  return localPart && localPart.length > 0 ? localPart : "User";
}

export function Sidebar({
  collapsed,
  onToggle,
  userEmail,
}: {
  collapsed: boolean;
  onToggle: () => void;
  userEmail: string;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminFeedbackBadgeCount, setAdminFeedbackBadgeCount] = useState(0);

  const isAdmin = userEmail.trim().toLowerCase() === ADMIN_EMAIL;

  const fallbackFromEmail = getDisplayNameFromEmail(userEmail);
  const profileName = user?.username?.trim() || user?.fullName?.trim() || user?.firstName?.trim();
  const userName = profileName && profileName.length > 0 ? profileName : fallbackFromEmail;

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let isCancelled = false;

    const loadUnreadFeedbackCount = async () => {
      try {
        const response = await fetch("/api/feedback/unread-count", { cache: "no-store" });
        if (!response.ok || isCancelled) {
          return;
        }

        const data = (await response.json()) as { count?: number };
        if (!isCancelled) {
          setAdminFeedbackBadgeCount(Math.max(0, data.count ?? 0));
        }
      } catch {
        // Ignore badge fetch errors so navigation remains unaffected.
      }
    };

    void loadUnreadFeedbackCount();

    return () => {
      isCancelled = true;
    };
  }, [isAdmin, pathname]);

  const renderNavItems = (isCompact: boolean, onClick?: () => void) => (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        const showFeedbackBadge = isAdmin && item.href === "/feedback" && adminFeedbackBadgeCount > 0;

        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            onClick={onClick}
            className={cn(
              "group relative flex items-center rounded-xl px-3 py-3 text-sm transition-all duration-300 ease-out",
              isCompact ? "justify-center" : "gap-3",
              isActive
                ? "border border-lime-300/35 bg-lime-300/12 text-lime-100 shadow-[0_12px_28px_rgba(0,0,0,0.22)]"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
            )}
            title={isCompact ? item.label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
                isCompact ? "max-w-0 -translate-x-1 opacity-0" : "max-w-35 translate-x-0 opacity-100",
              )}
              aria-hidden={isCompact}
            >
              {item.label}
            </span>
              {showFeedbackBadge ? (
                <span
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-full border border-lime-300/45 bg-lime-300/20 px-1.5 text-[10px] font-semibold text-lime-100",
                    isCompact ? "absolute right-2 top-2 min-w-4 px-1 text-[9px]" : "ml-auto",
                  )}
                  aria-label={`${adminFeedbackBadgeCount} unread feedback items`}
                  title={`${adminFeedbackBadgeCount} unread feedback items`}
                >
                  {adminFeedbackBadgeCount > 99 ? "99+" : adminFeedbackBadgeCount}
                </span>
              ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const renderUserPanel = (isCompact: boolean) => (
    <div
      className={cn(
        " transition-all duration-300 ease-out",
        isCompact ? "p-2" : "p-3",
      )}
    >
      <div className={cn("flex items-center", isCompact ? "justify-center" : "gap-3")}>
        <div className="transition-transform duration-300 ease-out">
          <UserButton />
        </div>
        <div
          className={cn(
            "min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
            isCompact ? "max-w-0 -translate-x-1 opacity-0" : "max-w-37.5 translate-x-0 opacity-100",
          )}
          aria-hidden={isCompact}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-lime-200/90">Welcome</p>
          <p className="truncate text-sm text-zinc-100">{userName}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-[#0d1410]/80 text-zinc-100 shadow-[0_10px_24px_rgba(0,0,0,0.32)] backdrop-blur md:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={18} />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/65 transition-opacity duration-200 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[86vw] max-w-[320px] flex-col border-r border-white/10 bg-[#0d1410]/95 p-4 backdrop-blur-xl transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <PlanYtLogo className="text-lg" />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-zinc-300 transition hover:text-zinc-100"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4">{renderUserPanel(false)}</div>
        <div className="flex-1">{renderNavItems(false, () => setMobileOpen(false))}</div>
      </aside>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 hidden border-r border-white/10 bg-[#0d1410]/85 p-3 backdrop-blur-xl transition-[width] duration-300 md:flex md:flex-col",
          collapsed ? "w-16" : "w-60 lg:w-64",
        )}
      >
        <div className={cn("mb-5", collapsed ? "p-2" : "p-4")}>
          <PlanYtLogo compact={collapsed} className={collapsed ? "block text-center" : "text-lg"} />
        </div>

        <div className="mb-4">{renderUserPanel(collapsed)}</div>

        <div className="flex-1">{renderNavItems(collapsed)}</div>

        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "mt-4 inline-flex items-center rounded-xl border border-white/15 px-3 py-2 text-sm text-zinc-300 transition-all duration-300 ease-out hover:border-lime-300/50 hover:text-zinc-100",
            collapsed ? "justify-center" : "gap-2",
          )}
          title={collapsed ? "Expand menu" : "Collapse menu"}
        >
          <PanelLeftClose
            size={16}
            className={cn("transition-transform duration-300 ease-out", collapsed ? "rotate-180" : "rotate-0")}
          />
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
              collapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-35 translate-x-0 opacity-100",
            )}
            aria-hidden={collapsed}
          >
            Collapse menu
          </span>
        </button>
      </aside>
    </>
  );
}
