import Image from 'next/image';
import Link from 'next/link';
import { IoAlbums, IoBookmark, IoMailOpen, IoShareSocial, IoLayers } from 'react-icons/io5';

import { Container } from '@/components/container';
import { Button } from '@/components/ui/button';
import { PricingSection } from '@/features/pricing/components/pricing-section';
import { WorkspacePreview } from '@/components/workspace-preview';

export default async function HomePage() {
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
      <Container className='relative rounded-lg bg-black py-20 lg:py-[140px]'>
        <div className='relative z-10 flex flex-col gap-6 lg:max-w-2xl lg:pl-8'>
          <div className='w-fit rounded-full bg-gradient-to-r from-[#616571] via-[#7782A9] to-[#826674] px-4 py-1'>
            <span className='font-alt text-sm font-semibold text-black mix-blend-soft-light'>
              VC‑grade AI research workspace
            </span>
          </div>
          <h1>
            A tier‑1 VC research desk for AI — in a Figma‑style tabbed workspace.
          </h1>
          <p className='text-lg text-neutral-300'>
            Open AI stories in tabs, overlay trust layers (Why it matters, 🌶 hype score, corroboration),
            and share annotated story views that drive confident decisions.
          </p>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <Button asChild variant='sexy'>
              <Link href='/signup'>Get started for free</Link>
            </Button>
            <Button asChild variant='ghost' className='text-neutral-300 hover:text-white'>
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
        className='absolute right-0 top-0 rounded-tr-lg'
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
    <section className='relative rounded-lg bg-black py-8'>
      <div className='relative z-10 m-auto flex max-w-[1200px] flex-col gap-10 px-4 pt-8 lg:pt-[140px]'>
        <h2 className='bg-gradient-to-br from-white to-neutral-200 bg-clip-text text-center text-3xl font-bold text-transparent lg:text-5xl'>
          Cut through AI hype. Ship with confidence.
        </h2>
        <p className='m-auto max-w-2xl text-center text-neutral-300'>
          ZEKE pairs a fast, tabbed workspace with trust layers — Why it matters, chili hype score, and corroborating sources —
          so you save 30–60 minutes a day and make better calls.
        </p>
        <ul className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {features.map(({ title, description, Icon }) => (
            <li key={title} className='rounded-md border border-zinc-800 bg-zinc-950/50 p-5'>
              <div className='mb-3 flex items-center gap-2'>
                <Icon className='text-cyan-400' size={22} />
                <span className='font-alt text-lg text-white'>{title}</span>
              </div>
              <p className='text-sm text-neutral-300'>{description}</p>
            </li>
          ))}
        </ul>
        <div className='flex justify-center'>
          <Button asChild variant='sexy'>
            <Link href='/signup'>Start free — open your first tab</Link>
          </Button>
        </div>
      </div>
      <Image
        src='/section-bg.png'
        width={1440}
        height={462}
        alt=''
        className='absolute left-0 top-0 rounded-t-lg'
        priority={false}
        quality={100}
      />
    </section>
  );
}
