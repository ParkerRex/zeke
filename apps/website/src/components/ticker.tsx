import { connectDb } from "@zeke/db/client";
import { sql } from "drizzle-orm";

export async function Ticker() {
  const db = await connectDb();

  // Query for sources processed and teams using Drizzle
  const [transactionsResult, teamsResult] = await Promise.all([
    db.execute(sql`SELECT COUNT(*) as count FROM transactions`),
    db.execute(sql`SELECT COUNT(*) as count FROM teams`),
  ]);

  const sourcesProcessed = Number(transactionsResult[0]?.count ?? 0);
  const teamsCount = Number(teamsResult[0]?.count ?? 0);

  // Calculate hours saved: assume each source saves ~2 hours of manual research
  const hoursSaved = (sourcesProcessed ?? 0) * 2;

  return (
    <div className="text-center flex flex-col mt-[120px] md:mt-[280px] mb-[120px] md:mb-[250px] space-y-4 md:space-y-10">
      <span className="font-medium text-center text-[40px] md:text-[80px] lg:text-[100px] xl:text-[130px] 2xl:text-[160px] md:mb-2 text-stroke leading-none">
        {Intl.NumberFormat("en-US", {
          maximumFractionDigits: 0,
        }).format(hoursSaved)}{" "}
        <span className="text-[#878787] text-[30px] md:text-[50px] lg:text-[60px] xl:text-[70px] 2xl:text-[80px]">
          hours
        </span>
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
