import Link from "next/link";

import { cn } from "@/lib/utils";

export function PlanYtLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Go to home page"
      className={cn(
        "inline-block whitespace-nowrap font-semibold tracking-tight text-white transition hover:text-lime-200",
        compact ? "text-sm sm:text-base" : "text-lg sm:text-xl",
        className,
      )}
    >
      {compact ? "PY" : "PlanYt"}
    </Link>
  );
}
