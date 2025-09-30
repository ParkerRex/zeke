"use client";
// Research Dashboard Widgets - Zeke's discovery → triage → apply → publish workflow

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@zeke/ui/carousel";
import * as React from "react";
import { Assistant } from "./assistant";
import { Inbox } from "./inbox";
import { WidgetsNavigation } from "./navigation";
import { Spending } from "./spending";
import { Tracker } from "./tracker";
import { Transactions } from "./transactions/transactions";
import { Vault } from "./vault";

export function Widgets() {
  const trpc = useTRPC();

  // Check if user has connected research sources instead of bank accounts
  const { data: sources } = useQuery(
    trpc.sources?.list?.queryOptions() ?? {
      queryKey: ["sources"],
      queryFn: () => [],
    },
  );

  // If the user has not connected any sources, show limited widgets
  const disabled = !sources?.length;

  const items = [
    <Assistant key="assistant" />,
    <Spending disabled={disabled} key="spending" />, // Repurposed for research budget/usage
    <Transactions disabled={disabled} key="transactions" />, // Repurposed for research activities
    <Tracker key="tracker" />, // Research time tracking
    <Inbox key="inbox" disabled={disabled} />, // Research inbox for triage
    <Vault key="vault" />, // Document vault for sources
  ];

  return (
    <Carousel
      className="flex flex-col"
      opts={{
        align: "start",
        watchDrag: false,
      }}
    >
      <WidgetsNavigation />
      <div className="ml-auto hidden md:flex">
        <CarouselPrevious className="static p-0 border-none hover:bg-transparent" />
        <CarouselNext className="static p-0 border-none hover:bg-transparent" />
      </div>

      <CarouselContent className="-ml-[20px] 2xl:-ml-[40px] flex-col md:flex-row space-y-6 md:space-y-0">
        {items.map((item, idx) => {
          return (
            <CarouselItem
              className="lg:basis-1/2 xl:basis-1/3 3xl:basis-1/4 pl-[20px] 2xl:pl-[40px]"
              key={idx.toString()}
            >
              {item}
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
}
