import Image from 'next/image';
import Link from 'next/link';
import { IoAlbums, IoBookmark, IoLayers,IoMailOpen, IoShareSocial } from 'react-icons/io5';
import { redirect } from 'next/navigation';

import { getSession } from '@db/queries/account/get-session';

import { Container } from '@/components/container';
import { Button } from '@/components/ui/button';
import { WorkspacePreview } from '@/components/workspace-preview';
import { PricingSection } from '@/components/pricing/pricing-section';

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect('/home');
  return (
    <div className='flex flex-col gap-8 lg:gap-32'>
      <HeroSection />
      <section>
        <WorkspacePreview />
      </section>
      <FeaturesSection />
      <PricingSection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className='relative overflow-hidden lg:overflow-visible'>
      {/* Reserve space on the right for the hero image on large screens */}
      <Container className='relative rounded-lg bg-white py-20 md:py-24 lg:py-[140px] md:pr-16 lg:pr-[420px] xl:pr-[520px]'>
        <div className='relative z-10 flex flex-col gap-6 lg:max-w-2xl lg:pl-8'>
          <div className='w-fit rounded-full bg-gradient-to-r from-[#616571] via-[#7782A9] to-[#826674] px-4 py-1 shadow-sm ring-1 ring-white/20'>
            <span className='font-alt text-sm font-semibold text-white'>
              VC‑grade AI research workspace
            </span>
          </div>
          <h1>
            A tier‑1 VC research desk for AI — in a Figma‑style tabbed workspace.
          </h1>
          <p className='text-lg text-gray-600'>
            Open AI stories in tabs, overlay trust layers (Why it matters, 🌶 hype score, corroboration),
            and share annotated story views that drive confident decisions.
          </p>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <Button asChild variant='default'>
              <Link href='/signup'>Launch your workspace</Link>
            </Button>
            <Button asChild variant='outline'>
              <Link href='/pricing'>See pricing</Link>
            </Button>
          </div>
        </div>
      </Container>
      <Image
        src='/hero-shape.png'
        width={867}
        height={790}
        alt=''
        className='hidden lg:block absolute right-0 top-0 z-0 h-full max-h-[790px] w-auto rounded-tr-lg object-contain pointer-events-none select-none'
        priority
        quality={100}
      />
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: 'Feed & Clustering',
      description:
        'Ingest curated AI sources, deduplicate and cluster into story groups ranked by recency, authority, corroboration and engagement.',
      Icon: IoLayers,
    },
    {
      title: 'Tabbed Workspace',
      description:
        'Open stories in tabs that feel like Figma/VSCode. Embed articles, YouTube, Reddit with a dockable overlay pane.',
      Icon: IoAlbums,
    },
    {
      title: 'Bookmarks & Highlights',
      description:
        'Save tabs and capture highlights with annotations. MVP stored per user in Supabase/Postgres.',
      Icon: IoBookmark,
    },
    {
      title: 'Shareable Tabs',
      description:
        'Generate a branded link that loads the story with overlays intact — great for debates and team alignment.',
      Icon: IoShareSocial,
    },
    {
      title: 'Daily Digest',
      description:
        'Automated “3 stories you need today.” Subscribe to watchlists to stay on top of sectors, companies, and tools.',
      Icon: IoMailOpen,
    },
  ];

  return (
    <section className='relative overflow-hidden rounded-lg bg-white'>
      {/* Top art area reserves height so text never overlaps */}
      <div className='relative h-[180px] sm:h-[220px] lg:h-[300px]'>
        <Image
          src='/section-bg.png'
          alt=''
          fill
          priority={false}
          quality={100}
          className='rounded-t-lg object-cover'
        />
      </div>
      <div className='relative z-10 m-auto flex max-w-[1200px] flex-col gap-10 px-4 py-8'>
        <h2 className='bg-gradient-to-br from-black to-gray-800 bg-clip-text text-center text-3xl font-bold text-transparent lg:text-5xl'>
          Cut through AI hype. Ship with confidence.
        </h2>
        <p className='m-auto max-w-2xl text-center text-gray-600'>
          ZEKE pairs a fast, tabbed workspace with trust layers — Why it matters, chili hype score, and corroborating sources —
          so you save 30–60 minutes a day and make better calls.
        </p>
        <ul className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {features.map(({ title, description, Icon }) => (
            <li key={title} className='rounded-md border border-gray-200 bg-gray-50 p-5 hover:bg-white hover:shadow-sm hover:border-gray-300 transition-all duration-150 cursor-pointer'>
              <div className='mb-3 flex items-center gap-2'>
                <Icon className='text-cyan-400' size={22} />
                <span className='font-alt text-lg text-black'>{title}</span>
              </div>
              <p className='text-sm text-gray-600'>{description}</p>
            </li>
          ))}
        </ul>
        {/* CTA removed per request to avoid "free" language */}
      </div>
      {/* Background image rendered above; nothing absolutely-positioned here */}
    </section>
  );
}
