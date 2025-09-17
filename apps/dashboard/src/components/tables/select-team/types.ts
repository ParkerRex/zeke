export type SelectTeamRow = {
  id: string;
  name: string | null;
  logoUrl?: string | null;
  role?: string | null;
};

export type TeamInviteRow = {
  id: string;
  email?: string;
  team?: {
    name?: string | null;
    logoUrl?: string | null;
  } | null;
};
