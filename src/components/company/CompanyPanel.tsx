'use client';
import Link from 'next/link';
import { COMPANIES } from '@/data/company';

export default function CompanyPanel() {

  return (
    <div>
      <div className='border-b bg-background/50 p-4 text-sm font-medium'>Companies</div>
      <ul className='p-2'>
        {COMPANIES.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/company/${c.slug}`}
              className='flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-gray-50'
            >
              <img
                alt=''
                className='h-6 w-6 rounded'
                src={`https://logo.clearbit.com/${c.domain}`}
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = 'none';
                }}
              />
              <div className='min-w-0'>
                <div className='truncate font-medium text-gray-900'>{c.name}</div>
                <div className='truncate text-xs text-gray-500'>CEO: {c.ceo}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
