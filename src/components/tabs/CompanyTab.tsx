"use client";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import StoryRow from "@/components/feed/StoryRow";
import type { Tab } from "@/lib/tabsStore";
import { companyViewParser } from "@/libs/nuqs";
import type { Cluster } from "@/types/stories";

const COMPANY_KEYWORDS: Record<string, { company: string[]; ceo: string[] }> = {
  openai: { company: ["openai", "gpt", "chatgpt"], ceo: ["sam altman"] },
  anthropic: { company: ["anthropic", "claude"], ceo: ["dario amodei"] },
  deepmind: { company: ["deepmind"], ceo: ["demis hassabis"] },
  meta: { company: ["meta", "facebook", "llama"], ceo: ["mark zuckerberg"] },
  mistral: { company: ["mistral"], ceo: ["arthur mensch"] },
  cohere: { company: ["cohere"], ceo: ["aidan gomez"] },
  perplexity: { company: ["perplexity"], ceo: ["aravind srinivas"] },
  stability: {
    company: ["stability", "stable diffusion"],
    ceo: ["emad mostaque"],
  },
  xai: { company: ["xai"], ceo: ["elon musk"] },
  openrouter: { company: ["openrouter"], ceo: ["emil"] },
};

export default function CompanyTab({ tab }: { tab: Tab }) {
  const [view, setView] = useQueryState("view", companyViewParser);
  const name = (tab.context?.company as string) ?? "";
  const slug = (tab.context?.slug as string) ?? "";
  const ceo = (tab.context?.ceo as string) ?? "";
  const domain = (tab.context?.domain as string) ?? "";

  const [clusters, setClusters] = useState<Cluster[]>([]);
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const r = await fetch("/api/stories", { signal: ac.signal }).then((x) =>
          x.json()
        );
        if (!ac.signal.aborted) setClusters(r.clusters ?? []);
      } catch (e: unknown) {
        const { isAbortError } = await import("@/utils/errors");
        if (isAbortError(e)) return;
        console.error(e);
      }
    })();
    return () => ac.abort("CompanyTab unmounted");
  }, []);

  const { news, ceoNews } = useMemo(() => {
    const keys = COMPANY_KEYWORDS[slug] ?? { company: [slug], ceo: [ceo] };
    const inText = (c: Cluster, arr: string[]) =>
      arr.some((k) => `${c.title} ${c.primaryUrl}`.toLowerCase().includes(k));
    return {
      news: clusters.filter((c) => inText(c, keys.company)),
      ceoNews: clusters.filter((c) => inText(c, keys.ceo)),
    };
  }, [clusters, slug, ceo]);

  return (
    <div className="h-full overflow-auto">
      <div className="flex items-center gap-2 border-b bg-background/50 p-3 font-medium text-sm">
        {domain ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="h-5 w-5 rounded"
            src={`https://logo.clearbit.com/${domain}`}
          />
        ) : null}
        <span>Company › {name}</span>
        <div className="ml-auto flex items-center gap-1 text-xs">
          <button
            className={`rounded px-2 py-1 ${view === "news" ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}
            onClick={() => void setView("news")}
          >
            News
          </button>
          <button
            className={`rounded px-2 py-1 ${view === "ceo" ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}
            onClick={() => void setView("ceo")}
          >
            CEO
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 p-4 lg:grid-cols-2">
        {view === "ceo" ? (
          <>
            <section>
              <h3 className="mb-2 font-semibold text-sm">CEO — {ceo}</h3>
              <div className="divide-y rounded-md border bg-white">
                {(ceoNews.length ? ceoNews : clusters).slice(0, 6).map((c) => (
                  <StoryRow cluster={c} key={c.id} />
                ))}
              </div>
            </section>
            <section>
              <h3 className="mb-2 font-semibold text-sm">Recent news</h3>
              <div className="divide-y rounded-md border bg-white">
                {(news.length ? news : clusters).slice(0, 6).map((c) => (
                  <StoryRow cluster={c} key={c.id} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <section>
              <h3 className="mb-2 font-semibold text-sm">Recent news</h3>
              <div className="divide-y rounded-md border bg-white">
                {(news.length ? news : clusters).slice(0, 6).map((c) => (
                  <StoryRow cluster={c} key={c.id} />
                ))}
              </div>
            </section>
            <section>
              <h3 className="mb-2 font-semibold text-sm">CEO — {ceo}</h3>
              <div className="divide-y rounded-md border bg-white">
                {(ceoNews.length ? ceoNews : clusters).slice(0, 6).map((c) => (
                  <StoryRow cluster={c} key={c.id} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
