"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { IoLogoGithub, IoLogoGoogle } from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import type { ActionResponse } from "@/types/action-response";
import { cn } from "@/utils/cn";

const titleMap = {
  login: "Welcome back",
  signup: "Join ZEKE and start getting insights",
} as const;

export function AuthUI({
  mode,
  signInWithOAuth,
  signInWithEmail,
  showBrand = true,
  align = "center",
}: {
  mode: "login" | "signup";
  signInWithOAuth: (provider: "github" | "google") => Promise<ActionResponse>;
  signInWithEmail: (email: string) => Promise<ActionResponse>;
  showBrand?: boolean;
  align?: "left" | "center";
}) {
  const [pending, setPending] = useState(false);
  const [emailFormOpen, setEmailFormOpen] = useState(true);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = event.target as HTMLFormElement;
    const email = form["email"].value;
    const response = await signInWithEmail(email);

    if (response?.error) {
      toast({
        variant: "destructive",
        description:
          "An error occurred while authenticating. Please try again.",
      });
    } else {
      toast({
        description: `To continue, click the link in the email sent to: ${email}`,
      });
    }

    form.reset();
    setPending(false);
  }

  async function handleOAuthClick(provider: "google" | "github") {
    setPending(true);
    const response = await signInWithOAuth(provider);

    if (response?.error) {
      toast({
        variant: "destructive",
        description:
          "An error occurred while authenticating. Please try again.",
      });
      setPending(false);
    }
  }

  const alignClass = align === "left" ? "text-left" : "text-center";

  return (
    <section
      className={cn("mt-16 w-full rounded-lg bg-white p-10 px-4", alignClass)}
    >
      <div
        className={cn(
          "flex flex-col gap-4",
          align === "left" ? "" : "items-center"
        )}
      >
        {showBrand && (
          <Image
            alt=""
            className={cn(align === "left" ? "" : "m-auto")}
            height={80}
            src="/logo.png"
            width={80}
          />
        )}
        <h1 className="font-medium text-2xl">{titleMap[mode]}</h1>
        {mode === "signup" ? (
          <p className="text-gray-600 text-sm">Create a new account</p>
        ) : (
          <p className="text-gray-600 text-sm">Sign in to your account</p>
        )}
      </div>
      <div className="mt-8 flex flex-col gap-4">
        <Button
          className="flex w-full items-center justify-center gap-2 py-4"
          disabled={pending}
          onClick={() => handleOAuthClick("github")}
          size="lg"
          type="button"
          variant="default"
        >
          <IoLogoGithub size={20} />
          Continue with GitHub
        </Button>
        <Button
          className="flex w-full items-center justify-center gap-2 py-4"
          disabled={pending}
          onClick={() => handleOAuthClick("google")}
          size="lg"
          type="button"
          variant="outline"
        >
          <IoLogoGoogle size={20} />
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="my-2 flex items-center gap-3 text-gray-500">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs">or</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Form section */}
        {/* Email-only form for both login and signup */}
        <form className="mt-1 space-y-3" onSubmit={handleEmailSubmit}>
          <div className="space-y-1">
            <label className="text-sm" htmlFor="email">
              Email
            </label>
            <Input
              aria-label={mode === "login" ? "Email" : "Enter your email"}
              autoFocus={align === "left"}
              id="email"
              name="email"
              placeholder="you@example.com"
              type="email"
            />
          </div>
          <div className="flex justify-end">
            <Button disabled={pending} type="submit">
              {pending
                ? "Sending…"
                : mode === "login"
                ? "Email me a sign-in link"
                : "Sign up with Email"}
            </Button>
          </div>
        </form>
      </div>
      {mode === "signup" && (
        <span
          className={cn(
            "mt-8 block max-w-sm text-gray-600 text-sm",
            align === "left" ? "" : "m-auto"
          )}
        >
          By clicking continue, you agree to our{" "}
          <Link
            className="underline transition-all duration-150 hover:no-underline"
            href="/terms"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            className="underline transition-all duration-150 hover:no-underline"
            href="/privacy"
          >
            Privacy Policy
          </Link>
          .
        </span>
      )}
      {mode === "login" && (
        <div
          className={cn(
            "mt-6 text-gray-700 text-sm",
            align === "left" ? "" : "text-center"
          )}
        >
          Don’t have an account?{" "}
          <Link className="underline hover:no-underline" href="/signup">
            Sign Up Now
          </Link>
        </div>
      )}
    </section>
  );
}
