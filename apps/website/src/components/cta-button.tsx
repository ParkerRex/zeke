import { Button } from "@zeke/ui/button";
import { Icons } from "@zeke/ui/icons";
import Link from "next/link";

export function CtaButton({ children }: { children: React.ReactNode }) {
  return (
    <Link href="https://app.zekehq.com">
      <Button
        className="mt-12 h-11 space-x-2 items-center py-2"
        variant="outline"
      >
        <span>{children}</span>
        <Icons.ArrowOutward />
      </Button>
    </Link>
  );
}
