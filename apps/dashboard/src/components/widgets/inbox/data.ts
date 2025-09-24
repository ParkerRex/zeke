// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.


export const inboxData = [];

export const options = ["all", "todo", "done"] as const;
export type InboxOption = (typeof options)[number];
