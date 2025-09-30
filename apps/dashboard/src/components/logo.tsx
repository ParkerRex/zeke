import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link
      className="flex w-fit cursor-pointer items-center gap-2 transition-all duration-150 hover:opacity-80"
      href="/"
    >
      <Image
        alt="ZEKE logo mark"
        height={40}
        priority
        quality={100}
        src="/logo.png"
        width={40}
      />
      <span className="font-alt text-black text-xl">ZEKE</span>
    </Link>
  );
}
