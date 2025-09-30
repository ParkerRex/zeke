import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

/**
 * Hook to manage modal/sheet state via URL parameters
 * Provides consistent state management for all overlays
 */
export function useModalParams() {
  const [params, setParams] = useQueryStates({
    // Source intake sheet
    sourceIntake: parseAsBoolean,
    sourceUrl: parseAsString,

    // Assistant modal
    assistant: parseAsBoolean,
    chatId: parseAsString,
    assistantPrompt: parseAsString,

    // Playbook run sheet
    playbookRun: parseAsBoolean,
    playbookId: parseAsString,

    // Notification center
    notifications: parseAsBoolean,

    // Insight link sheet
    insightLink: parseAsBoolean,
    insightId: parseAsString,
    highlightId: parseAsString,

    // Search modal (keeping from existing)
    search: parseAsBoolean,
  });

  return {
    ...params,
    setParams,
    // Helper functions for common operations
    openSourceIntake: (url?: string) =>
      setParams({ sourceIntake: true, sourceUrl: url }),
    closeSourceIntake: () =>
      setParams({ sourceIntake: false, sourceUrl: null }),

    openAssistant: (chatId?: string, prompt?: string) =>
      setParams({
        assistant: true,
        chatId: chatId ?? null,
        assistantPrompt: prompt ?? null,
      }),
    closeAssistant: () =>
      setParams({ assistant: false, chatId: null, assistantPrompt: null }),

    openPlaybookRun: (playbookId?: string) =>
      setParams({ playbookRun: true, playbookId: playbookId }),
    closePlaybookRun: () => setParams({ playbookRun: false, playbookId: null }),

    openNotifications: () => setParams({ notifications: true }),
    closeNotifications: () => setParams({ notifications: false }),

    openInsightLink: (insightId?: string, highlightId?: string) =>
      setParams({ insightLink: true, insightId, highlightId }),
    closeInsightLink: () =>
      setParams({ insightLink: false, insightId: null, highlightId: null }),
  };
}
