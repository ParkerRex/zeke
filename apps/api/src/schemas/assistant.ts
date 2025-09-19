import { z } from "@hono/zod-openapi";
import { highlightOriginSchema } from "./highlight";

export const assistantThreadStatusSchema = z
  .enum(["active", "resolved", "archived"])
  .openapi({
    description: "Lifecycle status for an assistant thread",
    example: "active",
  });

export const assistantMessageRoleSchema = z
  .enum(["user", "assistant", "system"])
  .openapi({
    description: "Role of the sender for a chat message",
    example: "assistant",
  });

const transcriptTurnSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Transcript turn identifier",
      example: "d7c6b5a4-3210-fedc-ba98-76543210fedc",
    }),
    storyId: z.string().uuid().openapi({
      description: "Story the turn belongs to",
      example: "9f3a4c3f-6f5a-4d2e-97cf-0b3e20a1f4f2",
    }),
    chapterId: z.string().uuid().nullable().openapi({
      description: "Chapter identifier if present",
      example: "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    }),
    speaker: z.string().nullable().openapi({
      description: "Speaker name from transcripts",
      example: "Greg Brockman",
    }),
    content: z.string().nullable().openapi({
      description: "Turn text",
      example: "We scaled the model to handle real-time multimodal inputs.",
    }),
    startSeconds: z.number().nullable().openapi({
      description: "Start timestamp (seconds)",
      example: 120.5,
    }),
    endSeconds: z.number().nullable().openapi({
      description: "End timestamp (seconds)",
      example: 142.3,
    }),
  })
  .openapi({
    description: "Transcript snippet referenced by the assistant",
  });

const highlightPreviewSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Highlight identifier",
      example: "2a4b6c8d-0e1f-2345-6789-abcdef012345",
    }),
    storyId: z.string().uuid().openapi({
      description: "Story containing the highlight",
      example: "9f3a4c3f-6f5a-4d2e-97cf-0b3e20a1f4f2",
    }),
    teamId: z.string().uuid().nullable().openapi({
      description: "Owning team if scoped",
      example: "1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809",
    }),
    title: z.string().nullable().openapi({
      description: "Highlight title",
      example: "Novel claim",
    }),
    summary: z.string().nullable().openapi({
      description: "Short summary",
      example: "GPT-5 uses 10x more compute than GPT-4",
    }),
    quote: z.string().nullable().openapi({
      description: "Quoted snippet",
      example: "We had to redesign our inference stack...",
    }),
    origin: highlightOriginSchema,
    createdAt: z.string().nullable().openapi({
      description: "When the highlight was created",
      example: "2024-05-16T08:42:00Z",
    }),
  })
  .openapi({
    description: "Compact highlight preview returned inside assistant payloads",
  });

export const assistantThreadSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Assistant thread identifier",
      example: "4d3c2b1a-7890-1234-5678-abcdef012345",
    }),
    teamId: z.string().uuid().openapi({
      description: "Team the thread belongs to",
      example: "1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809",
    }),
    storyId: z.string().uuid().nullable().openapi({
      description: "Story context if scoped",
      example: "9f3a4c3f-6f5a-4d2e-97cf-0b3e20a1f4f2",
    }),
    playbookId: z.string().uuid().nullable().openapi({
      description: "Playbook context if scoped",
      example: "d1c2b3a4-5678-90ab-cdef-1234567890ab",
    }),
    goalId: z.string().uuid().nullable().openapi({
      description: "Goal context if scoped",
      example: "abcd1234-ef56-7890-ab12-cd34567890ef",
    }),
    createdBy: z.string().uuid().openapi({
      description: "User who opened the thread",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    topic: z.string().nullable().openapi({
      description: "Optional topic label",
      example: "Prompt for Coding Assistants",
    }),
    status: assistantThreadStatusSchema,
    startedAt: z.string().nullable().openapi({
      description: "When the thread began",
      example: "2024-05-16T08:40:00Z",
    }),
  })
  .openapi({
    description: "Assistant chat thread",
  });

export const assistantThreadSourceSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Thread source identifier",
      example: "0f1e2d3c-4b5a-6789-0123-abcdef456789",
    }),
    threadId: z.string().uuid().openapi({
      description: "Thread the source belongs to",
      example: "4d3c2b1a-7890-1234-5678-abcdef012345",
    }),
    highlightId: z.string().uuid().nullable().openapi({
      description: "Linked highlight, if any",
      example: "2a4b6c8d-0e1f-2345-6789-abcdef012345",
    }),
    turnId: z.string().uuid().nullable().openapi({
      description: "Linked transcript turn, if any",
      example: "d7c6b5a4-3210-fedc-ba98-76543210fedc",
    }),
    addedBy: z.string().uuid().openapi({
      description: "User who attached the source",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    position: z.number().int().openapi({
      description: "Ordering index within the thread",
      example: 3,
    }),
    addedAt: z.string().nullable().openapi({
      description: "Timestamp when the source was added",
      example: "2024-05-16T08:55:00Z",
    }),
    highlight: highlightPreviewSchema.optional(),
    turn: transcriptTurnSchema.optional(),
  })
  .openapi({
    description: "Pinned reference inside the assistant workspace",
  });

export const assistantMessageSourceSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Message source identifier",
      example: "aa11bb22-cc33-dd44-ee55-ff6677889900",
    }),
    messageId: z.string().uuid().openapi({
      description: "Message the source is attached to",
      example: "5a4b3c2d-1098-7654-3210-fedcba987654",
    }),
    highlightId: z.string().uuid().nullable().openapi({
      description: "Reference highlight id",
      example: "2a4b6c8d-0e1f-2345-6789-abcdef012345",
    }),
    turnId: z.string().uuid().nullable().openapi({
      description: "Reference transcript turn id",
      example: "d7c6b5a4-3210-fedc-ba98-76543210fedc",
    }),
    confidence: z.number().nullable().openapi({
      description: "Model confidence for the citation",
      example: 0.82,
    }),
    highlight: highlightPreviewSchema.optional(),
    turn: transcriptTurnSchema.optional(),
  })
  .openapi({
    description: "Citation attached to a chat message",
  });

export const assistantMessageSchema = z
  .object({
    id: z.string().uuid().openapi({ description: "Message identifier" }),
    threadId: z.string().uuid().openapi({
      description: "Thread the message belongs to",
      example: "4d3c2b1a-7890-1234-5678-abcdef012345",
    }),
    senderId: z.string().uuid().nullable().openapi({
      description: "User who sent the message (null for assistant/system)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    role: assistantMessageRoleSchema,
    body: z.string().openapi({
      description: "Message content",
      example: "Here are the key findings about GPT-5...",
    }),
    metadata: z.record(z.unknown()).nullable().openapi({
      description: "Additional metadata for the message",
    }),
    createdAt: z.string().nullable().openapi({
      description: "Timestamp when the message was created",
      example: "2024-05-16T09:00:00Z",
    }),
    sources: z
      .array(assistantMessageSourceSchema)
      .openapi({ description: "Citations attached to the message" }),
  })
  .openapi({
    description: "Assistant chat message",
  });

export const assistantThreadContextInputSchema = z
  .object({
    storyId: z.string().uuid().nullable().optional().openapi({
      description: "Story to scope the thread to",
      example: "9f3a4c3f-6f5a-4d2e-97cf-0b3e20a1f4f2",
    }),
    playbookId: z.string().uuid().nullable().optional().openapi({
      description: "Playbook to scope the thread to",
      example: "d1c2b3a4-5678-90ab-cdef-1234567890ab",
    }),
    goalId: z.string().uuid().nullable().optional().openapi({
      description: "Goal to scope the thread to",
      example: "abcd1234-ef56-7890-ab12-cd34567890ef",
    }),
    topic: z.string().nullable().optional().openapi({
      description: "Optional topic label to set",
      example: "Prompt for Coding Assistants",
    }),
  })
  .openapi({
    description: "Context for fetching or creating an assistant thread",
  });

export const assistantMessagesInputSchema = z
  .object({
    threadId: z.string().uuid().openapi({
      description: "Thread identifier",
      example: "4d3c2b1a-7890-1234-5678-abcdef012345",
    }),
    limit: z
      .number()
      .int()
      .min(1)
      .max(200)
      .default(50)
      .openapi({ description: "Number of messages to return", example: 50 }),
    before: z.string().nullable().optional().openapi({
      description: "Return messages created before this ISO timestamp",
      example: "2024-05-16T09:00:00Z",
    }),
  })
  .openapi({
    description: "Parameters for listing assistant messages",
  });

export const assistantCreateMessageInputSchema = z
  .object({
    threadId: z.string().uuid().openapi({
      description: "Thread to append the message to",
      example: "4d3c2b1a-7890-1234-5678-abcdef012345",
    }),
    role: assistantMessageRoleSchema.default("user"),
    body: z.string().min(1).openapi({
      description: "Message text",
      example: "Can you summarize the key claims?",
    }),
    metadata: z.record(z.unknown()).nullable().optional().openapi({
      description: "Optional metadata for the message",
    }),
  })
  .openapi({
    description: "Payload for creating an assistant message",
  });

export const assistantThreadIdInputSchema = z
  .object({
    threadId: z.string().uuid().openapi({
      description: "Assistant thread identifier",
      example: "4d3c2b1a-7890-1234-5678-abcdef012345",
    }),
  })
  .openapi({
    description: "Input requiring an assistant thread id",
  });

export const assistantAddSourceInputSchema = z
  .object({
    threadId: z.string().uuid().openapi({
      description: "Thread to attach the source to",
      example: "4d3c2b1a-7890-1234-5678-abcdef012345",
    }),
    highlightId: z.string().uuid().nullable().optional().openapi({
      description: "Highlight to link",
      example: "2a4b6c8d-0e1f-2345-6789-abcdef012345",
    }),
    turnId: z.string().uuid().nullable().optional().openapi({
      description: "Transcript turn to link",
      example: "d7c6b5a4-3210-fedc-ba98-76543210fedc",
    }),
    position: z
      .number()
      .int()
      .nullable()
      .optional()
      .openapi({ description: "Optional position override", example: 4 }),
  })
  .superRefine((value, ctx) => {
    if (!value.highlightId && !value.turnId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either highlightId or turnId",
        path: ["highlightId"],
      });
    }
  })
  .openapi({
    description: "Parameters for adding a source to a thread",
  });

export const assistantRemoveSourceInputSchema = z
  .object({
    threadId: z.string().uuid().openapi({
      description: "Thread the source belongs to",
      example: "4d3c2b1a-7890-1234-5678-abcdef012345",
    }),
    threadSourceId: z.string().uuid().openapi({
      description: "Identifier of the source to remove",
      example: "0f1e2d3c-4b5a-6789-0123-abcdef456789",
    }),
  })
  .openapi({
    description: "Parameters for removing an assistant thread source",
  });

export const assistantLinkMessageSourcesInputSchema = z
  .object({
    messageId: z.string().uuid().openapi({
      description: "Message to attach sources to",
      example: "5a4b3c2d-1098-7654-3210-fedcba987654",
    }),
    highlightIds: z
      .array(z.string().uuid())
      .optional()
      .openapi({ description: "Highlight citations to attach" }),
    turnIds: z
      .array(z.string().uuid())
      .optional()
      .openapi({ description: "Transcript turn citations to attach" }),
  })
  .openapi({
    description: "Parameters for linking citations to a message",
  });

export type AssistantThread = z.infer<typeof assistantThreadSchema>;
export type AssistantMessage = z.infer<typeof assistantMessageSchema>;
export type AssistantThreadSource = z.infer<typeof assistantThreadSourceSchema>;
export type AssistantMessageSource = z.infer<
  typeof assistantMessageSourceSchema
>;
export type AssistantThreadContextInput = z.infer<
  typeof assistantThreadContextInputSchema
>;
export type AssistantMessagesInput = z.infer<
  typeof assistantMessagesInputSchema
>;
