"use client";

import { InfiniteMovingCards } from "@/components/infinite-moving-cards";
import React from "react";
import { cn } from "@zeke/ui/cn";

const testimonials = [
  {
    name: "Sarah Chen",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    handle: "@sarahchen",
    verified: false,
    quote: "Finally turned my 50+ saved podcast episodes into actionable insights. Saved me 20+ hours this week.",
  },
  {
    name: "Marcus Johnson",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    handle: "@marcusj_dev",
    verified: false,
    quote: "The timestamp citations are a game-changer. I can verify every insight instantly.",
  },
  {
    name: "Emma Rodriguez",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    handle: "@emmarod",
    verified: false,
    quote:
      "I was drowning in research papers and YouTube videos. Zeke helped me surface patterns I completely missed.",
  },
  {
    name: "Alex Patel",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    handle: "@alexpatel",
    verified: false,
    quote: "Turned 3 hours of podcast listening into a 5-minute brief with all the key insights.",
  },
  {
    name: "Jordan Lee",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
    handle: "@jordanlee_pm",
    verified: false,
    quote: "The custom playbooks feature is incredible. I can now systematically process competitive research.",
  },
  {
    name: "Taylor Kim",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor",
    handle: "@taylorkim",
    verified: false,
    quote: "Being able to export verified citations with timestamps makes my research reports 10x more credible.",
  },
  {
    name: "Jamie Santos",
    handle: "@jamiesantos",
    verified: false,
    quote: "The source integration is seamless. I just paste a link and get comprehensive insights back.",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie",
  },
  {
    name: "Casey Morgan",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Casey",
    handle: "@caseymorgan",
    verified: false,
    quote: "Zeke processes everything from ArXiv papers to YouTube tutorials. My research workflow is finally unified.",
  },
  {
    name: "River Thompson",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=River",
    handle: "@riverthompson",
    verified: false,
    quote:
      "I used to spend entire Sundays organizing research notes. Now it's automated and I can focus on building.",
  },
  {
    name: "Morgan Walsh",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan",
    handle: "@morganwalsh_",
    verified: false,
    quote: "The insight extraction is scary good. It finds connections between sources that I would have never noticed manually.",
  },
  {
    name: "Dakota Price",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Dakota",
    handle: "@dakotaprice",
    verified: false,
    quote:
      "As a founder, research is critical but time-consuming. Zeke gives me back hours every week while keeping me better informed.",
  },
];

// Sources that Zeke processes - formatted to work with InfiniteMovingCards
const sources = [
  { name: "YouTube", domain: "youtube.com" },
  { name: "Anthropic", domain: "anthropic.com" },
  { name: "OpenAI", domain: "openai.com" },
  { name: "Google DeepMind", domain: "deepmind.google" },
  { name: "Hacker News", domain: "news.ycombinator.com" },
  { name: "Apple Podcasts", domain: "podcasts.apple.com" },
  { name: "Spotify", domain: "spotify.com" },
  { name: "Medium", domain: "medium.com" },
  { name: "Substack", domain: "substack.com" },
  { name: "GitHub", domain: "github.com" },
  { name: "Reddit", domain: "reddit.com" },
  { name: "Twitter", domain: "x.com" },
  { name: "ArXiv", domain: "arxiv.org" },
  { name: "Vercel", domain: "vercel.com" },
];

export function Testimonials() {
  return (
    <div className="relative pb-22">
      <h3 className="text-4xl mb-8 font-medium">What people say</h3>
      <InfiniteMovingCards items={testimonials} direction="left" speed="slow" />
    </div>
  );
}

export function SourceLogos() {
  return (
    <div className="relative pb-22">
      <h3 className="text-4xl mb-8 font-medium">Sources we process</h3>
      <InfiniteMovingLogos items={sources} direction="left" speed="slow" />
    </div>
  );
}

// Custom infinite moving component for logos
function InfiniteMovingLogos({
  items,
  direction = "left",
  speed = "slow",
  pauseOnHover = true,
  className,
}: {
  items: { name: string; domain: string }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);
  const [start, setStart] = React.useState(false);

  React.useEffect(() => {
    addAnimation();
  }, []);

  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }

  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards",
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse",
        );
      }
    }
  };

  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 overflow-hidden -ml-4 md:-ml-[1200px] w-screen md:w-[calc(100vw+1400px)]",
        className,
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex min-w-full shrink-0 gap-8 py-4 w-max flex-nowrap items-center",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
      >
        {items.map((source, idx) => (
          <li
            className="w-[310px] max-w-full relative flex-shrink-0 border border-border dark:bg-[#121212] px-8 py-12 md:w-[310px] flex items-center justify-center"
            key={`${source.domain}-${idx}`}
          >
            <div
              aria-hidden="true"
              className="user-select-none -z-1 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
            />
            <img
              src={`https://img.logo.dev/${source.domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=240&retina=true`}
              alt={source.name}
              className="h-16 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all"
              loading="lazy"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
