import { useAnalytics } from "@/hooks/use-analytics";
import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { useEffect, useRef } from "react";
import { BriefCanvas } from "./brief-canvas";
import { PlaybookCanvas } from "./playbook-canvas";
import { SummaryCanvas } from "./summary-canvas";
// Research-focused canvas components
import { TrendCanvas } from "./trend-canvas";

// Legacy finance canvas components (to be deprecated)
import { BalanceSheetCanvas } from "./balance-sheet-canvas";
import { BurnRateCanvas } from "./burn-rate-canvas";
import { CashFlowCanvas } from "./cash-flow-canvas";
import { CategoryExpensesCanvas } from "./category-expenses-canvas";
import { HealthReportCanvas } from "./health-report-canvas";
import { ProfitAnalysisCanvas } from "./profit-analysis-canvas";
import { ProfitCanvas } from "./profit-canvas";
import { RevenueCanvas } from "./revenue-canvas";
import { RunwayCanvas } from "./runway-canvas";

export function Canvas() {
  const { current } = useArtifacts({
    exclude: ["chat-title", "followup-questions"],
  });
  const { track } = useAnalytics();
  const lastTrackedRef = useRef<string | null>(null);

  // Track when an artifact is opened
  useEffect(() => {
    if (current?.type && current.type !== lastTrackedRef.current) {
      // Map artifact types to analytics-friendly names
      const artifactTypeMap: Record<string, string> = {
        "trend-analysis": "trend-analysis",
        "research-brief": "research-brief",
        playbook: "playbook",
        "source-summary": "source-summary",
        // Legacy types
        "burn-rate": "finance-burn-rate",
        "revenue-canvas": "finance-revenue",
        "profit-canvas": "finance-profit",
        "runway-canvas": "finance-runway",
        "cash-flow-canvas": "finance-cash-flow",
        "balance-sheet-canvas": "finance-balance-sheet",
        "category-expenses-canvas": "finance-expenses",
        "health-report-canvas": "finance-health",
        "profit-analysis-canvas": "finance-profit-analysis",
        "spending-canvas": "finance-spending",
      };

      track("ArtifactOpened", {
        type: artifactTypeMap[current.type] || current.type,
        source: "tool",
        chatId: current.chatId || "unknown",
      });

      lastTrackedRef.current = current.type;
    }
  }, [current?.type, track]);

  switch (current?.type) {
    // Research canvas components
    case "trend-analysis":
      return <TrendCanvas />;
    case "research-brief":
      return <BriefCanvas />;
    case "playbook":
      return <PlaybookCanvas />;
    case "source-summary":
      return <SummaryCanvas />;

    // Legacy finance canvas (to be deprecated)
    case "burn-rate":
      return <BurnRateCanvas />;
    case "revenue-canvas":
      return <RevenueCanvas />;
    case "profit-canvas":
      return <ProfitCanvas />;
    case "runway-canvas":
      return <RunwayCanvas />;
    case "cash-flow-canvas":
      return <CashFlowCanvas />;
    case "balance-sheet-canvas":
      return <BalanceSheetCanvas />;
    case "category-expenses-canvas":
      return <CategoryExpensesCanvas />;
    case "health-report-canvas":
      return <HealthReportCanvas />;
    case "profit-analysis-canvas":
      return <ProfitAnalysisCanvas />;

    default:
      return null;
  }
}
