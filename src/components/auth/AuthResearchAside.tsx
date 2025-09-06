export function AuthResearchAside() {
  return (
    <div className='m-auto max-w-xl p-10 text-left'>
      <div className='mb-10 max-w-prose text-2xl leading-relaxed text-gray-800'>
        <span className='text-4xl leading-snug text-gray-300'>“</span>
        The AI industry moves hourly, but teams still spend valuable time
        chasing headlines, opening dozens of tabs, and trying to separate
        hype from signal. ZEKE gives you the signal in minutes, not hours.
      </div>

      <div className='grid grid-cols-2 gap-6'>
        <Stat number='6–10 hrs' label='per week spent “researching”' />
        <Stat number='70%+' label='of links are low-signal or duplicative' />
        <Stat number='10–15' label='newsletters monitored but rarely read' />
        <Stat number='3–5 tabs' label='deep just to verify a claim' />
      </div>

      <ul className='mt-10 space-y-2 text-gray-700'>
        <li>• Context switching kills focus and retention</li>
        <li>• Important product updates are easy to miss</li>
        <li>• Competitive moves get buried in noise</li>
      </ul>

      <p className='mt-8 text-sm text-gray-500'>
        ZEKE sifts the firehose, clusters related stories, and surfaces the few
        items worth your time.
      </p>
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className='rounded-lg border p-5'>
      <div className='font-alt text-2xl md:text-3xl'>{number}</div>
      <div className='mt-1 text-sm text-gray-600'>{label}</div>
    </div>
  );
}

