"use client";

import { useCallback } from "react";

import type { UnifiedApp } from "@/data/app-store";
import { Button } from "@zeke/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@zeke/ui/card";
import Image from "next/image";
import Link from "next/link";

type Props = {
  app: UnifiedApp;
  userEmail?: string;
};

function renderLogo(logo: UnifiedApp["logo"], name: string) {
  if (!logo) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-sm font-semibold text-primary">
        {name.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  if (typeof logo === "string") {
    return (
      <Image
        src={logo}
        alt={`${name} logo`}
        width={40}
        height={40}
        className="rounded-md object-contain"
      />
    );
  }

  const Logo = logo;
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent">
      <Logo />
    </div>
  );
}

export function UnifiedAppComponent({ app, userEmail }: Props) {
  const handlePrimaryAction = useCallback(() => {
    if (app.onInitialize) {
      return app.onInitialize();
    }

    if (app.installUrl) {
      window.open(app.installUrl, "_blank", "noopener,noreferrer");
    }

    return Promise.resolve();
  }, [app]);

  const showWebsiteButton = Boolean(app.website);
  const isInstalled = Boolean(app.installed);
  const primaryLabel = isInstalled
    ? "Installed"
    : app.type === "external"
      ? "Connect"
      : "Install";

  const isPrimaryDisabled = isInstalled && !app.installUrl;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          {renderLogo(app.logo, app.name)}
          <span className="text-xs uppercase text-muted-foreground">
            {app.category}
          </span>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-base leading-tight">{app.name}</CardTitle>
          {app.short_description && (
            <CardDescription>{app.short_description}</CardDescription>
          )}
        </div>
      </CardHeader>

      {app.description && (
        <CardContent className="text-sm text-muted-foreground">
          {app.description}
        </CardContent>
      )}

      <CardFooter className="mt-auto flex flex-col gap-2">
        <div className="flex w-full items-center gap-2">
          <Button
            className="flex-1"
            size="sm"
            onClick={handlePrimaryAction}
            disabled={isPrimaryDisabled && !app.installUrl && !app.onInitialize}
          >
            {primaryLabel}
          </Button>
          {showWebsiteButton && (
            <Button asChild size="sm" variant="outline">
              <Link href={app.website!} target="_blank" rel="noreferrer">
                Website
              </Link>
            </Button>
          )}
        </div>
        {userEmail && isInstalled && (
          <p className="text-xs text-muted-foreground">
            Connected as {userEmail}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
