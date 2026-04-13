import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

import { PlanYtLogo } from "@/components/brand/planyt-logo";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(177,255,69,0.16),transparent_38%),linear-gradient(180deg,#0b0f0c_0%,#090d0a_100%)]" />
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
        <div className="mb-5 flex items-center justify-between">
          <PlanYtLogo />
          <Link href="/" className="text-sm text-zinc-400 transition hover:text-zinc-200">
            Back home
          </Link>
        </div>
        <SignUp
          // appearance={{
          //   variables: {
          //     colorBackground: "#0d1410",
          //     colorInputBackground: "#0d1410",
          //     colorInputText: "#f5f8f4",
          //     colorText: "#f5f8f4",
          //     colorTextSecondary: "#a1a1aa",
          //     colorPrimary: "#b4f85a",
          //     colorDanger: "#fb7185",
          //     borderRadius: "12px",
          //   },
          // }}
        />
      </div>
    </div>
  );
}
