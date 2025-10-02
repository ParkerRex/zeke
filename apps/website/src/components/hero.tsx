import { Button } from "@zeke/ui/button";
import Link from "next/link";
import { HeroImage } from "./hero-image";
import { Metrics } from "./metrics";
import { WordAnimation } from "./word-animation";

export function Hero() {
  return (
    <section className="mt-[60px] lg:mt-[180px] min-h-[530px] relative lg:h-[calc(100vh-300px)]">
      <div className="flex flex-col">
        <Link href="/blog/zeke-v1-1">
          <Button
            variant="outline"
            className="rounded-full border-border flex space-x-2 items-center"
          >
            <span className="text-xs">Zeke v1.1</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={12}
              height={12}
              fill="none"
            >
              <path
                fill="currentColor"
                d="M8.783 6.667H.667V5.333h8.116L5.05 1.6 6 .667 11.333 6 6 11.333l-.95-.933 3.733-3.733Z"
              />
            </svg>
          </Button>
        </Link>

        <h2 className="mt-6 md:mt-10 max-w-[580px] text-[#878787] leading-tight text-[24px] md:text-[36px] font-medium">
          Turn podcasts, papers, videos, and posts into verified briefs,
          playbooks, and publish-ready outputs tailored for <WordAnimation />
        </h2>

        <div className="mt-8 md:mt-10">
          <a href="https://app.zekehq.com">
            <Button className="h-11 px-5">Start free trial</Button>
          </a>
        </div>

        <p className="text-xs text-[#707070] mt-4 font-mono">
          Start free trial, no credit card required.
        </p>
      </div>

      <HeroImage />
      <Metrics />
    </section>
  );
}
