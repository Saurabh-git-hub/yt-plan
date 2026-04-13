export function TestimonialCard({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md transition duration-300 hover:border-lime-300/35">
      <p className="text-sm leading-6 text-zinc-300">&ldquo;{quote}&rdquo;</p>
      <div className="mt-4">
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="text-xs text-zinc-500">{role}</p>
      </div>
    </article>
  );
}
