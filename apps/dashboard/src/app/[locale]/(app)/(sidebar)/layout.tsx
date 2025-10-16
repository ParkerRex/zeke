import { Header } from "@/components/header";
import { GlobalSheets } from "@/components/sheets/global-sheets";
import { Sidebar } from "@/components/sidebar";
import {
  HydrateClient,
  batchPrefetch,
  getQueryClient,
  trpc,
} from "@/trpc/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();


  // NOTE: These are used in the global sheets
batchPrefetch([
    trpc.team.current.queryOptions(),
    trpc.user.me.queryOptions(),
    trpc.search.global.queryOptions({ searchTerm: "" }),
  ]);


  const user = await queryClient.fetchQuery(trpc.user.me.queryOptions())

  if (!user) {
    redirect("/login");
  }

  // Profile gate
  if (!user.fullName) {
    redirect("/setup");
  }

  // Team selection gate
  if (!user.teamId) {
    redirect("/teams");
  }
  return (
    <HydrateClient>
      <div className="relative">
        <Sidebar />

        <div className="md:ml-[70px] pb-8">
          <Header />
          <div className="px-8">{children}</div>
        </div>

        <Suspense>
          <GlobalSheets />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
