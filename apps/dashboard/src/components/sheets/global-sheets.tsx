"use client";

import { use } from "react";
import { AssistantModal } from "@/components/assistant/assistant-modal";
import { TrialEndedModal } from "@/components/modals/trial-ended-modal";
import { SearchModal } from "@/components/search/search-modal";

export function GlobalSheets({}: Props) {
	return (
		<>
			<AssistantModal />
			<TrialEndedModal />
			<SearchModal />
		</>
	);
}
