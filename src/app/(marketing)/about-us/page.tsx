import Link from 'next/link';

export const dynamic = 'force-static';

export default function AboutUsPage() {
  return (
    <section className='rounded-lg bg-white px-4 py-16'>
      <h1 className='mb-4 text-center'>About Us</h1>
      <div className='mx-auto max-w-3xl space-y-4 text-gray-700'>
        <p>
          ZEKE is built and operated by Minton Holdings LLC. We’re crafting a focused research
          workspace for AI news and analysis to help teams make confident decisions faster.
        </p>
        <p>
          Have questions or feedback?{' '}
          <Link className='underline' href='/support'>Get in touch</Link> — we’d love to hear from you.
        </p>
      </div>
    </section>
  );
}
