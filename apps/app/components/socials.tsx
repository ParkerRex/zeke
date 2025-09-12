import { RiGithubFill, RiTwitterXFill } from "@remixicon/react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export default function Socials() {
  return (
    <div className="inline-flex flex-wrap gap-2">
      <div className="-space-x-px inline-flex rounded-lg shadow-black/[0.04] shadow-xs rtl:space-x-reverse">
        <Link
          aria-label="Open link"
          className={cn(
            buttonVariants({
              variant: "outline",
              className:
                "hidden rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:block",
            })
          )}
          href="https://x.com/felixlyu_1018/status/1852376714569015541"
          rel="noopener noreferrer"
          target="_blank"
        >
          Check out the tweet
        </Link>
        <Link
          aria-label="Open link"
          className={cn(
            buttonVariants({
              variant: "outline",
              size: "icon",
              className:
                "rounded-lg shadow-none focus-visible:z-10 md:rounded-none md:last:rounded-e-lg md:first:rounded-s-lg",
            })
          )}
          href="https://x.com/felixlyu_1018/status/1852376714569015541"
          rel="noopener noreferrer"
          target="_blank"
        >
          <RiTwitterXFill aria-hidden="true" size={16} />
        </Link>
      </div>

      <div className="-space-x-px inline-flex rounded-lg shadow-black/[0.04] shadow-xs rtl:space-x-reverse">
        <Link
          aria-label="Open link"
          className={cn(
            buttonVariants({
              variant: "outline",
              size: "icon",
              className:
                "rounded-lg shadow-none focus-visible:z-10 md:rounded-none md:last:rounded-e-lg md:first:rounded-s-lg",
            })
          )}
          href="https://github.com/lumpinif/drag-to-resize-sidebar.git"
          rel="noopener noreferrer"
          target="_blank"
        >
          <RiGithubFill aria-hidden="true" size={16} />
        </Link>
      </div>
    </div>
  );
}
