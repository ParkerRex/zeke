"use client";
import { COMPANIES } from "@/src/utils/constants";
import Image from "next/image";
import Link from "next/link";

export default function CompanyPanel() {
  return (
    <div>
      <div className="border-b bg-background/50 p-4 font-medium text-sm">
        Companies
      </div>
      <ul className="p-2">
        {COMPANIES.map((c) => (
          <li key={c.slug}>
            <Link
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-gray-50"
              href={`/company/${c.slug}`}
            >
              <Image
                alt=""
                className="h-6 w-6 rounded"
                height={24}
                src={`https://logo.clearbit.com/${c.domain}`}
                unoptimized={false}
                width={24}
              />
              <div className="min-w-0">
                <div className="truncate font-medium text-gray-900">
                  {c.name}
                </div>
                <div className="truncate text-gray-500 text-xs">
                  CEO: {c.ceo}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
