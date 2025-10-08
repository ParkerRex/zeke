import type { Scope } from "@api/utils/scopes";

type Resource = {
  key: string;
  name: string;
  description: string;
  scopes: ReadonlyArray<{
    scope: Scope;
    type: "read" | "write";
    label: string;
  }>;
};

export const RESOURCES = [
  {
    key: "chat",
    name: "Chat",
    description: "Access to assistant conversations.",
    scopes: [
      { scope: "chat.read", type: "read", label: "Read" },
      { scope: "chat.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "stories",
    name: "Stories",
    description: "Access to stories across the workspace.",
    scopes: [
      { scope: "stories.read", type: "read", label: "Read" },
      { scope: "stories.write", type: "write", label: "Write" },
      { scope: "stories.metrics", type: "read", label: "Metrics" },
    ],
  },
  {
    key: "highlights",
    name: "Highlights",
    description: "Access to highlights surfaced by Zeke.",
    scopes: [
      { scope: "highlights.read", type: "read", label: "Read" },
      { scope: "highlights.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "search",
    name: "Search",
    description: "Access to semantic search.",
    scopes: [{ scope: "search.read", type: "read", label: "Query" }],
  },
  {
    key: "tags",
    name: "Tags",
    description: "Access to the shared tag taxonomy.",
    scopes: [
      { scope: "tags.read", type: "read", label: "Read" },
      { scope: "tags.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "teams",
    name: "Teams",
    description: "Access to team directory and settings.",
    scopes: [
      { scope: "teams.read", type: "read", label: "Read" },
      { scope: "teams.manage", type: "write", label: "Manage" },
    ],
  },
  {
    key: "users",
    name: "Users",
    description: "Access to user profiles and roles.",
    scopes: [
      { scope: "users.read", type: "read", label: "Read" },
      { scope: "users.manage", type: "write", label: "Manage" },
    ],
  },
  {
    key: "jobs",
    name: "Jobs",
    description: "Permission to trigger background jobs.",
    scopes: [{ scope: "jobs.trigger", type: "write", label: "Trigger" }],
  },
] as const satisfies ReadonlyArray<Resource>;

export const getScopeDescription = (scope: string) => {
  // Handle special API-level scopes
  if (scope === "apis.all") {
    return {
      label: "Full access to all resources",
    };
  }

  if (scope === "apis.read") {
    return {
      label: "Read-only access to all resources",
    };
  }

  // Find the resource and scope
  for (const resource of RESOURCES) {
    const foundScope = resource.scopes.find((s) => s.scope === scope);
    if (foundScope) {
      return {
        label: `${foundScope.label} access to ${resource.name}`,
      };
    }
  }

  // Fallback for unknown scopes
  return {
    label: scope,
  };
};
