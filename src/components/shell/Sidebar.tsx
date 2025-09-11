"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IoAlbums,
  IoBookmarks,
  IoBusiness,
  IoCalendarClear,
  IoGrid,
  IoHome,
  IoNewspaper,
  IoSettings,
} from "react-icons/io5";

const items = [
  { href: "/home", label: "Home", Icon: IoHome },
  { href: "/today", label: "Today", Icon: IoCalendarClear },
  { href: "/stories", label: "Stories", Icon: IoNewspaper },
  { href: "/sector", label: "Sector", Icon: IoGrid },
  { href: "/company", label: "Company", Icon: IoBusiness },
  { href: "/watchlists", label: "Lists", Icon: IoBookmarks },
  { href: "/artifacts", label: "Artifacts", Icon: IoAlbums },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/ping", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (mounted) setIsAdmin(!!j?.isAdmin);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <nav className="hidden h-full flex-col items-center gap-2 p-2 sm:flex">
      {items.map(({ href, label, Icon }) => {
        const active =
          href === "/sector"
            ? pathname.startsWith("/sector")
            : href === "/stories"
              ? pathname.startsWith("/stories")
              : pathname === href;
        return (
          <Link
            className={`flex w-14 flex-col items-center gap-1 rounded-md px-1 py-2 text-center text-[10px] transition-colors hover:bg-gray-100 ${
              active ? "bg-gray-200 text-gray-900" : "text-gray-700"
            }`}
            href={href}
            key={href}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
      <div className="mt-auto" />
      {isAdmin && (
        <Link
          className={`mt-auto flex w-14 flex-col items-center gap-1 rounded-md px-1 py-2 text-center text-[10px] transition-colors hover:bg-gray-100 ${
            pathname === "/admin"
              ? "bg-gray-200 text-gray-900"
              : "text-gray-700"
          }`}
          href="/admin"
          title="Admin"
        >
          <IoSettings className="h-5 w-5" />
          <span className="truncate">Admin</span>
        </Link>
      )}
    </nav>
  );
}
