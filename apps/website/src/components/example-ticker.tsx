import { createServerClient } from "@supabase/ssr";
import type { Database } from "@zeke/supabase/types";

export async function Ticker() {
  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get() {
          return null;
        },
        set() {
          return null;
        },
        remove() {
          return null;
        },
      },
    },
  );

  // Query for sources processed and teams
  const [
    { count: sourcesProcessed },
    { count: teamsCount },
  ] = await Promise.all([
    client
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .limit(1),
    client.from("teams").select("id", { count: "exact", head: true }).limit(1),
  ]);

  // Calculate hours saved: assume each source saves ~2 hours of manual research
  const hoursSaved = (sourcesProcessed ?? 0) * 2;

  return (
    <div className="text-center flex flex-col mt-[120px] md:mt-[280px] mb-[120px] md:mb-[250px] space-y-4 md:space-y-10">
      <span className="font-medium text-center text-[40px] md:text-[80px] lg:text-[100px] xl:text-[130px] 2xl:text-[160px] md:mb-2 text-stroke leading-none">
        {Intl.NumberFormat("en-US", {
          maximumFractionDigits: 0,
        }).format(hoursSaved)}{" "}
        <span className="text-[#878787] text-[30px] md:text-[50px] lg:text-[60px] xl:text-[70px] 2xl:text-[80px]">hours</span>
      </span>
      <span className="text-[#878787]">
        Saved by compressing{" "}
        {Intl.NumberFormat("en-US", {
          maximumFractionDigits: 0,
        }).format(sourcesProcessed ?? 0)}{" "}
        sources across{" "}
        {Intl.NumberFormat("en-US", {
          maximumFractionDigits: 0,
        }).format(teamsCount ?? 0)}{" "}
        teams.
      </span>
    </div>
  );
}
