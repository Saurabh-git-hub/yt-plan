import type { LucideIcon } from "lucide-react";

export function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <article className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-lime-300/35 hover:bg-white/[0.06]">
      <div className="mb-4 inline-flex rounded-xl border border-lime-300/30 bg-lime-200/10 p-2 text-lime-200">
        <Icon size={18} />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
    </article>
  );
}
