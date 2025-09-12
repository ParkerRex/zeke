import { getSession } from "@db/queries/account/get-session";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import LatestNewsSection from "@/components/news/latest-news-section";
import PersonalizedNewsFeed from "@/components/news/personalized-news-feed";
import TopNewsSection from "@/components/news/top-news-section";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  // If Supabase sent us a code to the root URL, forward to the auth callback.
  const { code } = await searchParams;
  if (typeof code === "string" && code.length > 0) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}`);
  }

  const session = await getSession();
  if (session) {
    redirect("/home");
  }

  return (
    <section className="py-4">
      <div className="grid grid-cols-12 gap-4">
        {/* Left: lead + grid */}
        <div className="col-span-12 space-y-4 lg:col-span-8">
          <TopNewsSection />
          {/* Place Latest News directly under Top News in the main column */}
          <LatestNewsSection />
        </div>

        {/* Right: sidebar */}
        <aside className="col-span-12 space-y-4 lg:col-span-4">
          <DailyIndexCard />
          <AskZekeCard />
          <TopTopicsSidebar />
          <PromoCard />
        </aside>
      </div>

      {/* Latest News moved into main column above; keep the rest full‑width below */}
      <PersonalizedNewsFeed />
      {/* Topics strip */}
      <div className="mt-8">
        <TopicsStrip />
      </div>
    </section>
  );
}

// Top story helpers removed; using TopNewsSection

function AskZekeCard() {
  return (
    <section className="rounded-md border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">Ask ZEKE</h3>
      </div>
      <div className="space-y-3">
        <div className="text-gray-500 text-xs uppercase tracking-wide">
          View News Summary
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {["Last Day", "Last Week", "Last Month"].map((t, i) => (
            <span
              className={`rounded-full border px-2 py-1 ${i === 0 ? "bg-gray-900 text-white" : "bg-gray-50"}`}
              key={t}
            >
              {t}
            </span>
          ))}
        </div>
        <ul className="list-disc space-y-2 pl-5 text-gray-700 text-sm">
          <li>
            Open‑source model adoption accelerates; pricing pressure rises.
          </li>
          <li>Claude update sparks enterprise interest; eval focus grows.</li>
          <li>Benchmarks shift toward task‑level outcomes.</li>
        </ul>
        <div className="h-px bg-gray-200" />
        <div className="space-y-2">
          {[
            "What are the top 5 news events today?",
            "Which companies are making headlines this week?",
            "What are the most trending topics?",
          ].map((q) => (
            <button
              className="w-full rounded-full border bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"
              key={q}
              type="button"
            >
              {q}
            </button>
          ))}
        </div>
        <input
          className="w-full rounded-full border px-4 py-2 text-sm"
          placeholder="Ask a question"
        />
      </div>
    </section>
  );
}

function DailyIndexCard() {
  // Fake hype score using a deterministic seed from date
  const today = new Date();
  const seed =
    today.getFullYear() * 10_000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  const score = seed % 100; // 0..99
  const labels = ["Negative", "Neutral", "Optimistic", "Positive"] as const;
  const bucket = score < 25 ? 0 : score < 50 ? 1 : score < 75 ? 2 : 3;
  const bucketLabel = labels[bucket];
  const sentiment = score < 33 ? "Calm" : score < 66 ? "Serious" : "Hyped";

  return (
    <section className="rounded-md border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">Daily Index</h3>
        <div className="text-gray-500 text-xs">
          {today.toLocaleDateString()}
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] text-gray-600">
          <span>Negative</span>
          <span>Neutral</span>
          <span>Optimistic</span>
          <span>Positive</span>
        </div>
        <div className="relative h-8 w-full">
          <div className="absolute inset-0 flex items-center gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div className="h-1 flex-1 rounded bg-gray-200" key={i} />
            ))}
          </div>
          <div
            className="-top-1 absolute h-6 w-1.5 rounded bg-gray-900"
            style={{ left: `calc(${score}% - 2px)` }}
            title={`Index: ${score}`}
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-gray-900 px-1 font-medium text-white">
            {score}
          </span>
          <span className="font-medium">{sentiment}</span>
          <span className="text-gray-600">• {bucketLabel}</span>
        </div>
      </div>
    </section>
  );
}

function PromoCard() {
  return (
    <section className="overflow-hidden rounded-md border bg-white shadow-sm">
      <div className="relative h-[180px]">
        <Image alt="" className="object-cover" fill src="/hero-shape.png" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-xl">First 100 Days</h3>
        <p className="mt-1 text-gray-700 text-sm">
          See how you scored in predicting model & platform moves.
        </p>
        <Link
          className="mt-3 inline-block rounded-md bg-gray-900 px-3 py-2 text-sm text-white"
          href="/signup"
        >
          See predictions
        </Link>
      </div>
    </section>
  );
}

function TopicsStrip() {
  const columns: { title: string; links: { label: string; href: string }[] }[] =
    [
      {
        title: "Top Topics",
        links: [
          { label: "AGI Debate", href: "/stories?q=AGI" },
          {
            label: "Open‑source Models",
            href: "/stories?q=open-source%20models",
          },
          { label: "Agentic Workflows", href: "/stories?q=agent%20workflows" },
          {
            label: "Safety & Governance",
            href: "/stories?q=AI%20safety%20governance",
          },
        ],
      },
      {
        title: "Trending in AI",
        links: [
          { label: "Models & Benchmarks", href: "/stories?q=benchmark" },
          { label: "Tooling & Frameworks", href: "/stories?q=framework%20SDK" },
          {
            label: "Inference & Serving",
            href: "/stories?q=inference%20serving",
          },
          { label: "Funding & M&A", href: "/stories?q=funding%20acquisition" },
        ],
      },
      {
        title: "Research Areas",
        links: [
          { label: "Language", href: "/stories?q=LLM%20NLP" },
          { label: "Vision", href: "/stories?q=multimodal%20vision" },
          { label: "Robotics", href: "/stories?q=robotics" },
          {
            label: "Reinforcement Learning",
            href: "/stories?q=reinforcement%20learning",
          },
        ],
      },
      {
        title: "Platforms",
        links: [
          { label: "OpenAI", href: "/stories?q=OpenAI" },
          { label: "Anthropic", href: "/stories?q=Anthropic" },
          { label: "Meta", href: "/stories?q=Meta%20AI" },
          { label: "DeepMind", href: "/stories?q=DeepMind" },
        ],
      },
    ];

  return (
    <div className="overflow-hidden rounded-md border border-gray-300">
      <section className="bg-[#0B0B12] px-4 py-8 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <div className="mb-3 text-[11px] text-gray-400 uppercase tracking-wide">
                {col.title}
              </div>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      className="inline-flex items-center gap-2 font-medium text-gray-100 hover:underline"
                      href={l.href}
                    >
                      <span>{l.label}</span>
                      <span aria-hidden>↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      {/* Decorative multi‑rule */}
      <div className="bg-[#0B0B12]">
        <div className="px-4">
          <div className="h-1 bg-white/30" />
          <div className="h-1 bg-white/20" />
          <div className="h-px bg-white/10" />
        </div>
      </div>
      {/* Light spacer to echo screenshot */}
      <div className="h-4 bg-[#F2F2F7]" />
    </div>
  );
}

function TopTopicsSidebar() {
  const items = [
    { label: "AGI Debate", href: "/stories?q=AGI" },
    { label: "Open‑source Models", href: "/stories?q=open-source%20models" },
    { label: "Markets", href: "/stories?q=markets%20AI" },
    { label: "Agents", href: "/stories?q=agents" },
  ];
  return (
    <section className="rounded-md border bg-white p-4 shadow-sm">
      <h3 className="font-semibold">Top Topics</h3>
      <div className="my-2 space-y-[2px]">
        <div className="h-[2px] bg-gray-900" />
        <div className="h-[2px] bg-gray-900" />
        <div className="h-[1px] bg-gray-900" />
      </div>
      <ul className="divide-y">
        {items.map((t) => (
          <li className="flex items-center justify-between py-3" key={t.label}>
            <a
              className="flex items-center gap-3 hover:underline"
              href={t.href}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-gray-500" />
              <span className="font-medium">{t.label}</span>
            </a>
            <span aria-hidden className="text-gray-700 text-xl">
              +
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <a
          className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
          href="/stories"
        >
          View More{" "}
          <span aria-hidden className="text-lg leading-none">
            ↗
          </span>
        </a>
      </div>
    </section>
  );
}
