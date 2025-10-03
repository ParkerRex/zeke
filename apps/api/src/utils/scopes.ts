export const SCOPES = [
  "chat.read",
  "chat.write",
  "stories.read",
  "stories.write",
  "stories.metrics",
  "highlights.read",
  "highlights.write",
  "search.read",
  "tags.read",
  "tags.write",
  "teams.read",
  "teams.manage",
  "users.read",
  "users.manage",
] as const;

export type Scope = (typeof SCOPES)[number];
export type ScopePreset = "all_access" | "read_only" | "observer";

const readOnlyScopes = SCOPES.filter((scope) => scope.endsWith(".read"));
const observerScopes: Scope[] = [
  "stories.read",
  "stories.metrics",
  "highlights.read",
  "search.read",
];

export const scopePresets = [
  {
    value: "all_access" as const,
    label: "All Access",
    description: "Full access to every REST and TRPC surface",
    scopes: [...SCOPES],
  },
  {
    value: "read_only" as const,
    label: "Read Only",
    description: "Read access across the API",
    scopes: readOnlyScopes,
  },
  {
    value: "observer" as const,
    label: "Observer",
    description: "Read access limited to stories, highlights, and search",
    scopes: observerScopes,
  },
];

export const scopesToName = (scopes: string[]) => {
  if (scopes.includes("apis.all")) {
    return {
      name: "All access",
      description: "full access to all resources",
      preset: "all_access",
    };
  }

  if (scopes.includes("apis.read")) {
    return {
      name: "Read-only",
      description: "read-only access to all resources",
      preset: "read_only",
    };
  }

  return {
    name: "Restricted",
    description: "restricted access to some resources",
    preset: "restricted",
  };
};
export const expandScopes = (scopes: string[]): string[] => {
  if (scopes.includes("apis.all")) {
    // Return all scopes except any that start with "apis."
    return SCOPES.filter((scope) => !scope.startsWith("apis."));
  }

  if (scopes.includes("apis.read")) {
    // Return all read scopes except any that start with "apis."
    return SCOPES.filter(
      (scope) => scope.endsWith(".read") && !scope.startsWith("apis."),
    );
  }

  // For custom scopes, filter out any "apis." scopes
  return scopes.filter((scope) => !scope.startsWith("apis."));
};
