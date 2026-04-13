import { LegalPageShell } from "@/components/marketing/legal-page-shell";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="April 7, 2026">
      <section>
        <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
        <p className="mt-3 leading-7 text-zinc-300">
          We collect account details such as name, email, and authentication identifiers. We also collect
          activity data required to provide core product functionality, including playlists, goals, learning
          progress, and settings preferences.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">2. How We Use Information</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-zinc-300">
          <li>To create and manage your account.</li>
          <li>To save playlists, progress, and learning goals.</li>
          <li>To improve product quality, reliability, and user experience.</li>
          <li>To communicate essential service and security updates.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">3. Data Sharing</h2>
        <p className="mt-3 leading-7 text-zinc-300">
          We do not sell personal data. We may share limited data with trusted service providers for hosting,
          authentication, analytics, and support only when necessary to operate the service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">4. Data Retention and Security</h2>
        <p className="mt-3 leading-7 text-zinc-300">
          We retain your data as long as your account is active or as required by law. We apply reasonable
          technical and organizational safeguards to protect data from unauthorized access, loss, or misuse.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">5. Your Rights</h2>
        <p className="mt-3 leading-7 text-zinc-300">
          You can request access, correction, or deletion of your personal information by contacting us at
          privacy@planyt.app.
        </p>
      </section>
    </LegalPageShell>
  );
}
