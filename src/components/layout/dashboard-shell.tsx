"use client";

import { useState, type ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";

const SIDEBAR_STORAGE_KEY = "planyt-sidebar-collapsed";

export function DashboardShell({ children, userEmail }: { children: ReactNode; userEmail: string }) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
  });

  const onToggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-[#0b0f0c] text-zinc-100">
      <Sidebar collapsed={collapsed} onToggle={onToggleSidebar} userEmail={userEmail} />
      <div className={`flex min-h-screen flex-1 flex-col ${collapsed ? "md:pl-16" : "md:pl-60 lg:pl-64"}`}>
        <main className="relative flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_0%,rgba(177,255,69,0.12),transparent_36%),radial-gradient(circle_at_15%_100%,rgba(74,222,128,0.08),transparent_40%)]" />
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
