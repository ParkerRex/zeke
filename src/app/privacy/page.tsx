export const dynamic = 'force-static';

export default function PrivacyPage() {
  return (
    <section className='rounded-lg bg-white px-4 py-16'>
      <h1 className='mb-4 text-center'>Privacy Policy</h1>
      <div className='mx-auto max-w-3xl space-y-6 text-gray-700'>
        <p>
          Minton Holdings LLC (&quot;we&quot;, &quot;us&quot;) respects your privacy. This placeholder policy outlines
          our general approach to handling personal data in ZEKE.
        </p>
        <p>
          We collect only what’s needed to provide the service (e.g., account and subscription data). We don’t sell
          personal information. Third‑party processors (e.g., Supabase, Stripe) are used for authentication, data
          storage, and payments.
        </p>
        <p>For data access or deletion requests, please contact us via the Support page.</p>
        <p className='text-sm text-gray-500'>Effective date: 2025‑09‑03</p>
      </div>
    </section>
  );
}
