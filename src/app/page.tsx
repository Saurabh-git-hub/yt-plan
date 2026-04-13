import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  BarChart3,
  CalendarDays,
  CircleCheckBig,
  PlaySquare,
  Target,
  Zap,
} from "lucide-react";
import { redirect } from "next/navigation";

import { PlanYtLogo } from "@/components/brand/planyt-logo";
import { SectionReveal } from "@/components/marketing/section-reveal";

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  const features = [
    {
      icon: BarChart3,
      title: "Progress Tracking",
      description:
        "Get clear completion stats on every playlist and stay accountable every day.",
    },
    {
      icon: Target,
      title: "Goal Setting",
      description:
        "Set your target timeline and get an auto-calculated pace you can actually follow.",
    },
    {
      icon: CalendarDays,
      title: "Daily Plan",
      description:
        "Know exactly what to watch each day so your learning routine never feels random.",
    },
    {
      icon: PlaySquare,
      title: "In-app Video Player",
      description:
        "Watch and track progress in one focused workspace without context switching.",
    },
    {
      icon: Zap,
      title: "Fast Playlist Creation",
      description:
        "Paste links, structure videos, and start learning in minutes, not hours.",
    },
    {
      icon: CircleCheckBig,
      title: "Completion Tracking",
      description:
        "See your progress at a glance and stay motivated with visual completion indicators.",
    },
  ];

  const testimonials = [
    {
      quote:
        "I finally stopped saving random tutorials and started finishing structured tracks.",
      name: "Ayesha Khan",
      role: "Frontend Developer",
    },
    {
      quote:
        "The daily plan keeps me consistent. It feels like having a coach built into YouTube.",
      name: "Mateo Ruiz",
      role: "Product Manager",
    },
    {
      quote:
        "Clean, focused, and premium. PlanYt turned learning chaos into a reliable system.",
      name: "Nora Chen",
      role: "Startup Founder",
    },
  ];

  return (
    <div className="relative overflow-x-hidden pb-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-18%,rgba(177,255,69,0.2),transparent_44%),radial-gradient(circle_at_12%_92%,rgba(115,255,165,0.12),transparent_38%),linear-gradient(180deg,#0b0f0c_0%,#080b09_100%)]" />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0b0f0c]/85 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
          <PlanYtLogo />
          <nav className="hidden items-center gap-8 text-sm text-zinc-300 md:flex">
            <a href="#home" className="transition hover:text-white">
              Home
            </a>
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#how" className="transition hover:text-white">
              How it works
            </a>
            {/* <a href="#testimonials" className="transition hover:text-white">Testimonials</a> */}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 transition hover:border-lime-300/50"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-lime-300 px-4 py-2 text-sm font-semibold text-[#0a0e0b] shadow-[0_0_26px_rgba(177,255,69,0.2)] transition hover:bg-lime-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-14">
        <SectionReveal>
          <section
            id="home"
            className="relative mt-14 scroll-mt-28 text-center md:mt-20"
          >
            <div className="mx-auto w-fit rounded-full border border-lime-200/35 bg-lime-100/10 px-4 py-1 text-xs tracking-normal text-lime-200 ">
              STRUCTURED LEARNING FOR AMBITIOUS BUILDERS
            </div>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl md:text-7xl">
              Learn Faster with
              <br />
              Structured YouTube Playlists.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">
              Turn random YouTube videos into a clear learning path. Track your
              progress, stay consistent, and finish what you start.
            </p>
            <form
              action="/sign-up"
              className="mx-auto mt-10 flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl sm:flex-row"
            >
              <input
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                className="input-control flex-1"
              />
              <button type="submit" className="btn-primary h-12">
                Get Started
              </button>
            </form>
            {/* features list under the form */}

            {/* <div className="mt-5 flex items-center justify-center gap-6 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <CircleCheckBig size={14} className="text-lime-300" />
                No credit card
              </span>
              <span className="inline-flex items-center gap-1">
                <CircleCheckBig size={14} className="text-lime-300" />
                Start free in minutes
              </span>
            </div> */}

            {/* screenshot of the product on the right side of the hero section */}

            {/* <div className="relative mx-auto mt-14 max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-7">
              <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-lime-200/20 blur-3xl" />
              <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#0d1411]/80 p-4 md:grid-cols-[240px_1fr] md:p-6">
                <aside className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left">
                  <p className="text-sm font-semibold text-white">Your Learning Hub</p>
                  <div className="mt-4 space-y-2 text-sm text-zinc-400">
                    <p className="rounded-lg bg-lime-200/15 px-3 py-2 text-lime-200">Dashboard</p>
                    <p className="px-3 py-2">Playlists</p>
                    <p className="px-3 py-2">Goals</p>
                    <p className="px-3 py-2">Settings</p>
                  </div>
                </aside>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left md:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-zinc-300">System Design Fundamentals</p>
                    <p className="text-xs text-lime-200">72% complete</p>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-lime-300 to-emerald-300" />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="text-xs text-zinc-500">Today&apos;s target</p>
                      <p className="mt-1 text-sm font-semibold text-white">Watch 3 videos</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="text-xs text-zinc-500">Estimated time</p>
                      <p className="mt-1 text-sm font-semibold text-white">48 min/day</p>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
          </section>
        </SectionReveal>

        {/* logos of companies that use the product, in a grid, centered, with some opacity and blur on the background */}
        {/* <SectionReveal delay={0.08}>
          <section className="mt-16 md:mt-20">
            <p className="text-center text-sm text-zinc-500">Trusted by learners worldwide</p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-center text-sm text-zinc-400 sm:grid-cols-3 md:grid-cols-6">
              {"Nova Labs,Learnly,PathGrid,SkillForge,MentorHub,FlowClass".split(",").map((logo) => (
                <div key={logo} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 backdrop-blur-md">
                  {logo}
                </div>
              ))}
            </div>
          </section>
        </SectionReveal> */}

        <SectionReveal>
          <section className="mt-20">
            <div className="mx-auto max-w-4xl p-6 text-center backdrop-blur-xl md:p-8">
            {/* <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-xl md:p-8"> */}
              <p className="text-xs tracking-[0.2em] text-lime-200">
                THE PROBLEM
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white md:text-5xl">
                YouTube is full of knowledge, but learning there is chaotic
              </h2>
              <div className="mt-8 grid gap-4 text-left md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-[#0c120f] p-4">
                  <p className="text-base font-semibold text-white">
                    No progress tracking
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    You never know how far you&apos;ve come or what is left.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0c120f] p-4">
                  <p className="text-base font-semibold text-white">
                    No clear structure
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    Saved videos pile up with no order, path, or momentum.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0c120f] p-4">
                  <p className="text-base font-semibold text-white">
                    No daily goals
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    Without a daily target, consistency breaks and learning
                    stalls.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <section id="features" className="mt-20 scroll-mt-28">
            <div className="text-center">
              <p className="text-xs tracking-[0.22em] text-lime-200">
                FEATURES
              </p>
              <h3 className="mt-3 text-3xl font-semibold text-white md:text-5xl">
                Everything you need to learn faster
              </h3>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-lime-200/35 hover:bg-white/[0.05]"
                  >
                    <div className="mb-4 inline-flex rounded-xl border border-lime-200/30 bg-lime-200/10 p-2 text-lime-200 transition group-hover:scale-105">
                      <Icon size={18} />
                    </div>
                    <p className="text-base font-semibold text-white">
                      {feature.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <section
            id="how"
            className="mt-20 scroll-mt-28  p-6 md:p-8"
            // className="mt-20 scroll-mt-28 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
          >
            <div className="text-center">
              <p className="text-xs tracking-[0.2em] text-lime-200">
                HOW IT WORKS
              </p>
              <h3 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                Three simple steps to momentum
              </h3>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {["Create playlist", "Set goal", "Start learning"].map(
                (step, index) => (
                  <div
                    key={step}
                    className="rounded-2xl border border-white/10 bg-[#0c120f] p-5"
                  >
                    <p className="text-xs text-lime-200">STEP {index + 1}</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {step}
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      {index === 0 &&
                        "Paste video links and organize them into one structured path."}
                      {index === 1 &&
                        "Choose your timeline and get your daily learning target instantly."}
                      {index === 2 &&
                        "Track progress each session and finish what you started."}
                    </p>
                  </div>
                ),
              )}
            </div>
          </section>
        </SectionReveal>

        {/* testimonials section with a quote, name and role of the person, in a card, with some opacity and blur on the background, in a grid of 3 columns on desktop and 1 column on mobile */}

        {/* <SectionReveal>
          <section id="testimonials" className="mt-20 scroll-mt-28">
            <div className="text-center">
              <p className="text-xs tracking-[0.22em] text-lime-200">TESTIMONIALS</p>
              <h3 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Loved by focused learners</h3>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {testimonials.map((item) => (
                <article key={item.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                  <p className="text-sm leading-6 text-zinc-300">&ldquo;{item.quote}&rdquo;</p>
                  <p className="mt-5 text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-zinc-500">{item.role}</p>
                </article>
              ))}
            </div>
          </section>
        </SectionReveal> */}

        <SectionReveal>
          <section className="relative mt-20 overflow-hidden rounded-3xl border border-lime-200/20 bg-[#0d1411] p-8 text-center md:p-10">
            <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-56 w-[42rem] rounded-full bg-lime-200/25 blur-3xl" />
            <h3 className="text-3xl font-semibold text-white md:text-5xl">
              Stop scrolling. Start learning.
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-300">
              Build a repeatable system, hit your goals, and master any YouTube
              topic with clarity.
            </p>
            <form
              action="/sign-up"
              className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl sm:flex-row"
            >
              <input
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                className="input-control flex-1"
              />
              <button type="submit" className="btn-primary h-12">
                Get Started
              </button>
            </form>
          </section>
        </SectionReveal>
      </main>

      <footer className="border-t border-white/10 py-12">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 text-sm md:grid-cols-4">
          <div>
            <PlanYtLogo />
            <p className="mt-3 text-zinc-400">
              Structured YouTube learning paths for ambitious learners.
            </p>
            <p className="mt-2 text-zinc-400">
              Made with ❤️ by{" "}
              <Link
                href="https://saurabh-s-w-e.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lime-200 transition hover:text-lime-100"
              >
                Saurabh Chauhan
              </Link>
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Product</p>
            <p className="mt-2 text-zinc-400">
              {" "}
              <a href="#features" className="transition hover:text-white">
                Features
              </a>
            </p>
            <p className="mt-1 text-zinc-400">
              {" "}
              <a href="#how" className="transition hover:text-white">
                How it works
              </a>
            </p>
            {/* <p className="mt-1 text-zinc-400">Testimonials</p> */}
          </div>
          <div>
            <p className="font-semibold text-white">Company</p>
            <p className="mt-2 text-zinc-400">
              <a href="#home" className="transition hover:text-white">
                About
              </a>
            </p>
            <p className="mt-1 text-zinc-400">
              <Link
                href="/privacy-policy"
                className="transition hover:text-white"
              >
                Privacy Policy
              </Link>
            </p>
            <p className="mt-1 text-zinc-400">
              <Link
                href="/terms-of-service"
                className="transition hover:text-white"
              >
                Terms of Service
              </Link>
            </p>
            <p className="mt-1 text-zinc-400">
              <Link
                href="/cookie-policy"
                className="transition hover:text-white"
              >
                Cookie Policy
              </Link>
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Follow</p>
            
            <p className="mt-1 text-zinc-400"> <Link href="https://www.linkedin.com/in/saurabhchauhan2000/" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">LinkedIn</Link></p>
            <p className="mt-1 text-zinc-400"> <Link href="https://github.com/Saurabh-git-hub" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">GitHub</Link></p>
            <p className="mt-2 text-zinc-400"> <Link href="https://x.com/saurabh_10_12" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">X</Link></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
