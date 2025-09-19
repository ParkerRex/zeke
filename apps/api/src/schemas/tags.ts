import { z } from "@hono/zod-openapi";

export const tagSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier for the tag",
      example: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
    }),
    name: z.string().openapi({
      description: "Display name of the tag",
      example: "Important",
    }),
    teamId: z.string().uuid().openapi({
      description: "Owning team identifier",
      example: "1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809",
    }),
    createdAt: z.string().openapi({
      description: "Creation timestamp",
      example: "2024-05-16T08:25:00Z",
    }),
  })
  .openapi({ description: "Tag definition" });

export const createTagInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(48)
      .openapi({
        description: "Name for the new tag",
        example: "Key Insight",
      }),
  })
  .openapi({ description: "Payload for creating a tag" });

export const updateTagInputSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Tag identifier",
      example: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
    }),
    name: z
      .string()
      .trim()
      .min(1)
      .max(48)
      .openapi({
        description: "Updated tag name",
        example: "Urgent",
      }),
  })
  .openapi({ description: "Payload for updating a tag" });

export const deleteTagInputSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Tag identifier",
      example: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
    }),
  })
  .openapi({ description: "Payload for deleting a tag" });

export type TagSchema = z.infer<typeof tagSchema>;
