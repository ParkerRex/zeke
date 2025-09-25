import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const getGoalsArtifact = artifact(
  "get-goals",
  z.object({
    goals: z.array(z.string()),
  }),
);
