/**
 * Promo Card component
 * Promotional card with image and call-to-action
 */

import { Button } from "@zeke/ui/button";
import { Card, CardContent } from "@zeke/ui/card";
import Image from "next/image";
import Link from "next/link";

export function PromoCard() {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-[180px]">
        <Image
          alt="Promotional background"
          className="object-cover"
          fill
          src="/hero-shape.png"
        />
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-xl">First 100 Days</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          See how you scored in predicting model & platform moves.
        </p>
        <Button asChild className="mt-3">
          <Link href={`${process.env.NEXT_PUBLIC_APP_URL || "/"}/sign-up`}>
            See predictions
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
