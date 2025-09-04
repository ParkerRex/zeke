import { Button } from '@/components/ui/button';

export const dynamic = 'force-static';

const email = 'me@parkerrex.com';
const subject = encodeURIComponent('ZEKE: Contact');
const body = encodeURIComponent('I clicked the contact button on your site to reach out about');
const mailto = `mailto:${email}?subject=${subject}&body=${body}`;

export default function SupportPage() {
  return (
    <section className='rounded-lg bg-white px-4 py-16'>
      <h1 className='mb-6 text-center'>Support</h1>
      <div className='mx-auto max-w-xl space-y-6 text-center text-gray-700'>
        <p>
          Need help or have a question? Our small team at Minton Holdings LLC is here to help.
        </p>
        <div className='flex justify-center'>
          <Button asChild size='lg'>
            <a href={mailto}>Email Support</a>
          </Button>
        </div>
        <p className='text-sm text-gray-500'>Responses typically within 1–2 business days.</p>
      </div>
    </section>
  );
}
