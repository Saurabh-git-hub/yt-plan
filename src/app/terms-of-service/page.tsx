import { LegalPageShell } from "@/components/marketing/legal-page-shell";

export default function TermsOfServicePage() {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated="April 7, 2026">
      <section>
        <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
        <p className="mt-3 leading-7 text-zinc-300">
          By accessing or using PlanYt, you agree to these Terms of Service. If you do not agree, please do
          not use the service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">2. Account Responsibilities</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-zinc-300">
          <li>You are responsible for maintaining account confidentiality.</li>
          <li>You agree to provide accurate and current account information.</li>
          <li>You are responsible for activity that occurs under your account.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">3. Acceptable Use</h2>
        <p className="mt-3 leading-7 text-zinc-300">
          You agree not to misuse the service, interfere with platform operations, or attempt unauthorized
          access to systems, data, or accounts.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">4. Intellectual Property</h2>
        <p className="mt-3 leading-7 text-zinc-300">
          PlanYt branding, design, and software are protected by applicable intellectual property laws.
          You retain ownership of your own content and inputs.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">5. Limitation of Liability</h2>
        <p className="mt-3 leading-7 text-zinc-300">
          To the maximum extent permitted by law, PlanYt is provided on an as-is basis without warranties.
          We are not liable for indirect, incidental, or consequential damages related to service use.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">6. Contact</h2>
        <p className="mt-3 leading-7 text-zinc-300">For legal inquiries, contact legal@planyt.app.</p>
      </section>
    </LegalPageShell>
  );
}
