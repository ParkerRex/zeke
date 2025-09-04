import { PropsWithChildren } from 'react';
import Link from 'next/link';
import { IoLogoFacebook, IoLogoInstagram, IoLogoTwitter } from 'react-icons/io5';

import { Logo } from '@/components/logo';
import { Navigation } from '@/app/navigation';

export default function MarketingLayout({ children }: PropsWithChildren) {
  return (
    <div className='m-auto flex h-full max-w-[1440px] flex-col px-4'>
      <AppBar />
      <main className='relative flex-1'>
        <div className='relative h-full'>{children}</div>
      </main>
      <Footer />
    </div>
  );
}

function AppBar() {
  return (
    <header className='flex items-center justify-between py-8'>
      <Logo />
      <Navigation />
    </header>
  );
}

function Footer() {
  return (
    <footer className='mt-8 flex flex-col gap-8 text-gray-600 lg:mt-32'>
      <div className='flex flex-col justify-between gap-8 lg:flex-row'>
        <div>
          <Logo />
        </div>
        <div className='grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-4 lg:gap-16'>
          <div className='flex flex-col gap-2 lg:gap-6'>
            <div className='font-semibold text-black'>Product</div>
            <nav className='flex flex-col gap-2 lg:gap-6'>
              <Link href='/pricing' className='transition-all duration-150 cursor-pointer hover:underline'>
                Pricing
              </Link>
            </nav>
          </div>
          <div className='flex flex-col gap-2 lg:gap-6'>
            <div className='font-semibold text-black'>Company</div>
            <nav className='flex flex-col gap-2 lg:gap-6'>
              <Link href='/about-us' className='transition-all duration-150 cursor-pointer hover:underline'>
                About Us
              </Link>
              <Link href='/privacy' className='transition-all duration-150 cursor-pointer hover:underline'>
                Privacy
              </Link>
            </nav>
          </div>
          <div className='flex flex-col gap-2 lg:gap-6'>
            <div className='font-semibold text-black'>Support</div>
            <nav className='flex flex-col gap-2 lg:gap-6'>
              <Link href='/support' className='transition-all duration-150 cursor-pointer hover:underline'>
                Get Support
              </Link>
            </nav>
          </div>
          <div className='flex flex-col gap-2 lg:gap-6'>
            <div className='font-semibold text-black'>Follow us</div>
            <nav className='flex flex-col gap-2 lg:gap-6'>
              <Link href='#' className='transition-all duration-150 cursor-pointer hover:underline'>
                <span className='flex items-center gap-2'>
                  <IoLogoTwitter size={22} /> <span>Twitter</span>
                </span>
              </Link>
              <Link href='#' className='transition-all duration-150 cursor-pointer hover:underline'>
                <span className='flex items-center gap-2'>
                  <IoLogoFacebook size={22} /> <span>Facebook</span>
                </span>
              </Link>
              <Link href='#' className='transition-all duration-150 cursor-pointer hover:underline'>
                <span className='flex items-center gap-2'>
                  <IoLogoInstagram size={22} /> <span>Instagram</span>
                </span>
              </Link>
            </nav>
          </div>
        </div>
      </div>
      <div className='border-t border-gray-200 py-6 text-center'>
        <span className='text-gray-500 text-xs'>Copyright {new Date().getFullYear()} © ZEKE </span>
      </div>
    </footer>
  );
}

