import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href='/' className='flex w-fit items-center gap-2 hover:opacity-80 transition-all duration-150 cursor-pointer'>
      <Image src='/logo.png' width={40} height={40} priority quality={100} alt='ZEKE logo mark' />
      <span className='font-alt text-xl text-black'>ZEKE</span>
    </Link>
  );
}
