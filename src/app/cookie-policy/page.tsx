import { LegalPageShell } from "@/components/marketing/legal-page-shell";

export default function CookiePolicyPage() {
  return (
    <LegalPageShell title="Cookie Policy" lastUpdated="April 7, 2026">
      <section>
        <h2 className="text-xl font-semibold text-white">1. What Are Cookies</h2>
        <p className="mt-3 leading-7 text-zinc-300">
          Cookies are small text files stored on your device that help websites recognize your browser and
          remember preferences.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">2. How We Use Cookies</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-zinc-300">
          <li>Essential cookies for authentication and secure sessions.</li>
          <li>Preference cookies for language, theme, and interface settings.</li>
          <li>Analytics cookies to understand usage and improve product performance.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">3. Managing Cookies</h2>
        <p className="mt-3 leading-7 text-zinc-300">
          You can manage or disable cookies in your browser settings. Some features may not work correctly if
          essential cookies are blocked.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">4. Third-Party Cookies</h2>
        <p className="mt-3 leading-7 text-zinc-300">
          Some integrated services may set cookies to support authentication, analytics, or embedded content.
          Their usage is governed by their own privacy policies.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">5. Contact</h2>
        <p className="mt-3 leading-7 text-zinc-300">For cookie-related questions, contact privacy@planyt.app.</p>
      </section>
    </LegalPageShell>
  );
}
