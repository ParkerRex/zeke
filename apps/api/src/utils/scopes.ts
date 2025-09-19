export const SCOPES = [
  "stories.read",
  "stories.write",
  "stories.metrics",
  "highlights.read",
  "highlights.write",
  "assistant.read",
  "assistant.write",
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

export const scopesToName = (scopes: Scope[]) => {
  if (scopes.length === SCOPES.length) {
    return {
      name: "All Access",
      description: "Full access to every REST and TRPC surface",
      preset: "all_access" as const,
    };
  }

  const normalized = new Set(scopes);
  if (observerScopes.every((scope) => normalized.has(scope))) {
    return {
      name: "Observer",
      description: "Read access for stories, highlights, and search",
      preset: "observer" as const,
    };
  }

  if (scopes.every((scope) => scope.endsWith(".read"))) {
    return {
      name: "Read Only",
      description: "Read access across the API",
      preset: "read_only" as const,
    };
  }

  return {
    name: "Custom",
    description: "Custom mix of scopes",
    preset: undefined,
  } as const;
};

export const expandScopes = (scopes: string[]): Scope[] => {
  if (!scopes.length) {
    return [];
  }

  const allowed = new Set<Scope>();

  for (const scope of scopes) {
    if (scope === "all_access") {
      SCOPES.forEach((entry) => allowed.add(entry));
      continue;
    }

    if (scope === "read_only") {
      readOnlyScopes.forEach((entry) => allowed.add(entry));
      continue;
    }

    if (scope === "observer") {
      observerScopes.forEach((entry) => allowed.add(entry));
      continue;
    }

    if ((SCOPES as readonly string[]).includes(scope)) {
      allowed.add(scope as Scope);
    }
  }

  return Array.from(allowed);
};
