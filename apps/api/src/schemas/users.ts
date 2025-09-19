import { z } from "@hono/zod-openapi";

const dateFormatEnum = z
  .enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"])
  .openapi({
    description:
      "User's preferred date format. Available options: 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd.MM.yyyy'",
    example: "yyyy-MM-dd",
    "x-speakeasy-enums": [
      "ddSlashMMSlashyyyy",
      "MMSlashddSlashyyyy",
      "yyyyDashMMDashdd",
      "ddDotMMDotyyyy",
    ],
  });

const timeFormatEnum = z.union([z.literal(12), z.literal(24)]).openapi({
  description:
    "User's preferred time format: 12 for 12-hour format, 24 for 24-hour format",
  example: 24,
});

export const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(1, "fullName must contain at least 1 character")
    .max(80, "fullName must contain at most 80 characters")
    .optional()
    .nullable()
    .openapi({
      description: "Full name of the user. Must be between 1 and 80 characters",
      example: "Jane Doe",
    }),
  avatarUrl: z.string().url().optional().nullable().openapi({
    description: "URL to the user's avatar image",
    example: "https://cdn.zeke.ai/avatars/jane-doe.jpg",
  }),
  locale: z.string().min(2).max(10).optional().nullable().openapi({
    description:
      "User's preferred locale for internationalization (language and region)",
    example: "en-US",
  }),
  weekStartsOnMonday: z.boolean().optional().nullable().openapi({
    description:
      "Whether the user's calendar week starts on Monday (true) or Sunday (false)",
    example: true,
  }),
  timezone: z.string().min(1).max(64).optional().nullable().openapi({
    description: "User's timezone identifier in IANA Time Zone Database format",
    example: "America/New_York",
  }),
  timezoneAutoSync: z.boolean().optional().nullable().openapi({
    description: "Whether to automatically sync timezone with browser timezone",
    example: true,
  }),
  timeFormat: timeFormatEnum.optional().nullable(),
  dateFormat: dateFormatEnum.optional().nullable(),
});

const teamSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier of the team",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    name: z.string().openapi({
      description: "Name of the team or organization",
      example: "Acme Corporation",
    }),
    slug: z.string().min(1).openapi({
      description: "URL-friendly identifier for the team",
      example: "acme-corp",
    }),
    planCode: z.string().nullable().openapi({
      description: "Current subscription plan of the team",
      example: "pro",
    }),
  })
  .nullable()
  .openapi({
    description: "Team information that the user belongs to",
  });

export const userSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier of the user",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  email: z.string().email().openapi({
    description: "Email address of the user",
    example: "jane.doe@acme.com",
  }),
  fullName: z.string().nullable().openapi({
    description: "Full name of the user",
    example: "Jane Doe",
  }),
  avatarUrl: z.string().url().nullable().openapi({
    description: "URL to the user's avatar image",
    example: "https://cdn.zeke.ai/avatars/jane-doe.jpg",
  }),
  locale: z.string().nullable().openapi({
    description:
      "User's preferred locale for internationalization (language and region)",
    example: "en-US",
  }),
  weekStartsOnMonday: z.boolean().nullable().openapi({
    description:
      "Whether the user's calendar week starts on Monday (true) or Sunday (false)",
    example: true,
  }),
  timezone: z.string().nullable().openapi({
    description: "User's timezone identifier in IANA Time Zone Database format",
    example: "America/New_York",
  }),
  timezoneAutoSync: z.boolean().nullable().openapi({
    description: "Whether to automatically sync timezone with browser timezone",
    example: true,
  }),
  timeFormat: timeFormatEnum.nullable(),
  dateFormat: dateFormatEnum.nullable(),
  teamId: z.string().uuid().nullable().openapi({
    description: "Active team ID for the user, if assigned",
    example: "321e4567-e89b-12d3-a456-426614174999",
  }),
  createdAt: z.string().openapi({
    description: "ISO timestamp when the user was created",
    example: "2024-01-15T12:34:56.000Z",
  }),
  updatedAt: z.string().openapi({
    description: "ISO timestamp when the user was last updated",
    example: "2024-02-01T08:30:12.000Z",
  }),
  team: teamSchema,
});

export type UserSchema = z.infer<typeof userSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
