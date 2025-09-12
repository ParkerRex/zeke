export const dynamic = "force-static";

export default function TermsPage() {
  return (
    <section className="rounded-lg bg-white px-4 py-16">
      <h1 className="mb-4 text-center">Terms of Service</h1>
      <div className="mx-auto max-w-3xl space-y-6 text-gray-700">
        <p>
          These placeholder terms govern your use of ZEKE, a service operated by
          Minton Holdings LLC. By using the service, you agree to these terms.
        </p>
        <ul className="list-inside list-disc space-y-2">
          <li>Use the service responsibly and comply with applicable laws.</li>
          <li>
            Subscriptions are billed by Stripe; you can manage/cancel anytime
            via the portal.
          </li>
          <li>
            Service is provided “as is” without warranties to the extent
            permitted by law.
          </li>
          <li>
            We may update these terms; continued use constitutes acceptance of
            changes.
          </li>
        </ul>
        <p className="text-gray-500 text-sm">Effective date: 2025‑09‑03</p>
      </div>
    </section>
  );
}
