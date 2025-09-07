"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

type Node = {
  name: string;
  children?: string[];
};

const DATA: Node[] = [
  {
    name: "Marketing",
    children: ["Performance", "Brand", "Content", "SEO", "Growth"],
  },
  {
    name: "Design",
    children: ["Product Design", "UX Research", "Visual / Branding", "Motion"],
  },
  {
    name: "Creative",
    children: ["Video", "Editing", "Copywriting", "Illustration"],
  },
  {
    name: "Software Development",
    children: ["Web", "Mobile", "Data/ML", "Infrastructure", "Hardware"],
  },
  {
    name: "AI/ML Tools",
    children: ["Agents", "LLMOps", "Vector DBs", "Eval/Benchmarking"],
  },
  {
    name: "Research",
    children: ["NLP", "Vision", "Robotics", "Reinforcement Learning"],
  },
];

function slugify(label: string) {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[/]/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function IndustryPanel() {
  const params = useParams() as { slug?: string[] };
  const [sectorSlug, subSectorSlug] = Array.isArray(params?.slug)
    ? (params.slug as string[])
    : [];

  const sectorMap = useMemo(() => {
    const bySlug = new Map<string, string>();
    for (const n of DATA) {
      bySlug.set(slugify(n.name), n.name);
      for (const c of n.children ?? []) {
        bySlug.set(slugify(c), c);
      }
    }
    return bySlug;
  }, []);

  const selectedSectorLabel = sectorSlug
    ? sectorMap.get(sectorSlug)
    : undefined;
  const selectedSubLabel = subSectorSlug
    ? sectorMap.get(subSectorSlug)
    : undefined;

  return (
    <div>
      <div className="border-b bg-background/50 p-4 backdrop-blur">
        Sector{selectedSectorLabel ? ` › ${selectedSectorLabel}` : ""}
        {selectedSubLabel ? ` › ${selectedSubLabel}` : ""}
      </div>
      <div className="space-y-4 p-4">
        {DATA.map((n) => {
          const parentSlug = slugify(n.name);
          return (
            <div key={n.name}>
              <Link
                className="mb-2 block w-full rounded-md border bg-white px-3 py-2 text-left font-medium text-sm hover:border-gray-300 hover:bg-gray-50"
                href={`/sector/${parentSlug}`}
              >
                {n.name}
              </Link>
              <div className="ml-2 grid grid-cols-2 gap-1">
                {n.children?.map((c) => {
                  const childSlug = slugify(c);
                  return (
                    <Link
                      className="rounded-md border bg-white px-2 py-1 text-left text-xs hover:border-gray-300 hover:bg-gray-50"
                      href={`/sector/${parentSlug}/${childSlug}`}
                      key={c}
                    >
                      {c}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
