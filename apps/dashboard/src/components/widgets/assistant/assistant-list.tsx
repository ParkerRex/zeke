"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.



import { chatExamples } from "@/components/chat/examples";
import { useAssistantStore } from "@/store/assistant";

export function AssistantList() {
  const { setOpen } = useAssistantStore();

  return (
    <div className="mb-16">
      <ul className="flex flex-col justify-center items-center space-y-3 flex-shrink">
        {chatExamples.slice(0, 5).map((example) => (
          <li
            key={example}
            className="rounded-full dark:bg-secondary bg-[#F2F1EF] text-xs font-mono text-[#606060] hover:opacity-80 transition-all cursor-default"
          >
            <button
              onClick={() => setOpen(example)}
              type="button"
              className="inline-block p-3 py-2"
            >
              <span>{example}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
