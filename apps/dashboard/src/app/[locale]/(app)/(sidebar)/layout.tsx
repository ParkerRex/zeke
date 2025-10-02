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

  // Fetch current workspace - single query for all initial data
  const workspace = await queryClient
    .fetchQuery(trpc.workspace.get.queryOptions())
    .catch(() => null);

  if (!workspace) {
    redirect("/login");
  }

  const { user, team } = workspace;

  if (!user.fullName) {
    redirect("/setup");
  }

  if (!team) {
    redirect("/teams");
  }

  // Prefetch additional data for global sheets (research-focused)
  batchPrefetch([
    trpc.team.current.queryOptions(),
    trpc.search.global.queryOptions({ searchTerm: "" }),
  ]);

  return (
    <HydrateClient>
      <div className="relative">
        <Sidebar />

        <div className="md:ml-[70px] pb-8">
          <Header />
          <div className="px-6">{children}</div>
        </div>

        <Suspense>
          <GlobalSheets />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
