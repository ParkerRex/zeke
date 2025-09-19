/** Error thrown when a request is missing an authenticated user. */
export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Error thrown when the user is authenticated but lacks permissions. */
export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}
