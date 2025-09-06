export type ActionResponse<T = unknown, E = unknown> =
  | {
      data: T;
      error: E;
    }
  | undefined;
