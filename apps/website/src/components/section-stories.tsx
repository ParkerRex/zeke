"use client";

import { Avatar } from "@zeke/ui/avatar";
import { AvatarImageNext } from "@zeke/ui/avatar";
import { Button } from "@zeke/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zeke/ui/dialog";
import { Icons } from "@zeke/ui/icons";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { type Story, StoryCard } from "./story-card";

const ReactHlsPlayer = dynamic(() => import("react-hls-player"), {
  ssr: false,
});

const stories = [
  {
    id: 1,
    title: "“We brief partners in minutes—with every insight cited.”",
    description:
      "Weekly investment memos now start with a Zeke brief that cross-references podcasts, papers, and our community notes with receipts built in.",
    name: "Paweł Michalski",
    company: "VC Leaders",
    country: "Poland",
    src: "/stories/pawel.jpeg",
    content: [
      {
        type: "heading",
        content:
          "VC Leaders helps venture teams evaluate AI bets faster without adding headcount.",
      },
      {
        type: "question",
        content: "What did research look like before Zeke?",
      },
      {
        type: "paragraph",
        content:
          "We spent a full day every week skimming long podcasts, bookmarking threads, and trying to track sources. Everyone rewrote notes into their own decks and nothing was cited the same way twice.",
      },
      {
        type: "question",
        content: "How does Zeke change that workflow?",
      },
      {
        type: "paragraph",
        content:
          "Now we drop links into the Zeke inbox. It flags what’s actually novel, maps it to our thesis areas, and produces a partner-ready brief with timestamps. The playbook output already lists next steps for research, product, and investor updates.",
      },
      {
        type: "question",
        content: "What’s the best part for your team?",
      },
      {
        type: "paragraph",
        content:
          "The receipts are unbeatable. Every claim expands to the quote so partners trust the recommendation immediately.",
      },
    ],
  },
  {
    id: 2,
    title: "“Product marketing gets launch plans from research in one click.”",
    description:
      "Instead of drowning in transcripts, we load goals into Zeke and it drafts role-aware GTM plays with the proof attached.",
    name: "Guy Solan",
    company: "Thetis Medical",
    country: "United Kingdom",
    src: "/stories/guy.jpeg",
    content: [
      {
        type: "paragraph",
        content:
          "We track dozens of clinical podcasts, FDA filings, and forum threads. Zeke highlights the signals, compares them to our positioning, and then outputs a campaign brief we can ship the same day—with citations our compliance team loves.",
      },
    ],
  },
  {
    id: 3,
    title: "“Content calendars now start with cited research, not guesses.”",
    description:
      "Every article, thread, and email ships with a receipts appendix, so stakeholders sign off instantly.",
    name: "Facu Montanaro",
    company: "Kundo Studio",
    country: "Argentina",
    src: "/stories/facu.jpeg",
    content: [
      {
        type: "heading",
        content:
          "Kundo helps startups launch products backed by real user insights.",
      },
      {
        type: "question",
        content: "Why did you start using Zeke?",
      },
      {
        type: "paragraph",
        content:
          "We pull from AMAs, conference talks, and product reviews. Before Zeke, distilling that into content or client deliverables was chaos and we never had time to show the original sources.",
      },
      {
        type: "question",
        content: "How does it fit into your process now?",
      },
      {
        type: "paragraph",
        content:
          "We create a brief for each campaign, then let Zeke spin up long-form articles, social threads, and enablement emails with citations appended. Approvals are quicker because every insight links to the original clip or quote.",
      },
    ],
  },
];

function Video({ src }: { src: string }) {
  const playerRef = useRef(undefined);
  const [isPlaying, setPlaying] = useState(false);

  const togglePlay = () => {
    if (isPlaying) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }

    setPlaying((prev) => !prev);
  };

  return (
    <div className="w-full h-[280px] relative">
      <ReactHlsPlayer
        src={src}
        onClick={togglePlay}
        autoPlay={false}
        poster="https://cdn.zekehq.com/stories/guy-cover.png"
        playerRef={playerRef}
        className="w-full"
      />

      {!isPlaying && (
        <div className="absolute bottom-4 left-4 space-x-4 items-center justify-center z-30 transition-all">
          <Button
            size="icon"
            type="button"
            className="rounded-full size-10 md:size-14 transition ease-in-out hover:scale-110 hover:bg-white bg-white"
            onClick={togglePlay}
          >
            <Icons.Play size={24} className="text-black" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SectionStories() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  return (
    <Dialog>
      <div className="relative mt-20 pb-20">
        <div className="w-full h-full flex items-center flex-col z-10 relative">
          <h2 className="text-[56px] text-center font-medium mt-12">
            What our users say
          </h2>
          <div className="flex mt-20 -space-x-4">
            {stories.map((story, index) => (
              <div
                key={story.id}
                className={`transform ${
                  index % 2 === 0 ? "rotate-3" : "-rotate-3"
                } ${
                  index % 2 === 0 ? "translate-y-3" : "-translate-y-3"
                } hover:z-10 hover:-translate-y-5 transition-all duration-300`}
              >
                <DialogTrigger asChild>
                  <div onClick={() => setSelectedStory(story)}>
                    <StoryCard {...story} />
                  </div>
                </DialogTrigger>
              </div>
            ))}
          </div>
        </div>

        <div className="dotted-bg w-[calc(100vw+1400px)] h-full absolute top-0 -left-[1200px] z-0" />
      </div>

      <DialogContent className="max-w-[550px] !p-6 pt-10 max-h-[calc(100vh-200px)] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>{selectedStory?.title}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="size-6">
              <AvatarImageNext
                src={selectedStory?.src ?? ""}
                width={24}
                height={24}
                alt={selectedStory?.name ?? ""}
              />
            </Avatar>
            <div>
              <p>{selectedStory?.name}</p>
              <div className="flex items-center gap-2 text-[#878787]">
                <p className="text-sm">{selectedStory?.company}</p>
                {selectedStory?.country && (
                  <>
                    •<p className="text-sm">{selectedStory?.country}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selectedStory?.video && <Video src={selectedStory?.video} />}

          {selectedStory?.content?.map((item, index) =>
            item.type === "heading" ? (
              <h2 key={index.toString()} className="text-2xl font-medium">
                {item.content}
              </h2>
            ) : (
              <div
                key={index.toString()}
                className={item.type === "question" ? "text-[#878787]" : ""}
              >
                {item.content}
              </div>
            ),
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
