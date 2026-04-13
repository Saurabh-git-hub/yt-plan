export default function SettingsPage() {
  return (
    <div className="w-full">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-lime-200">Settings</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100 md:text-3xl">Account Preferences</h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-400">
          Account-level configuration and product preferences will be added here in upcoming releases.
        </p>
      </div>
    </div>
  );
}
