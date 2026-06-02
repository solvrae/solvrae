/** Base class for all Solvrae errors, carrying a stable machine-readable code. */
export class SolvraeError extends Error {
  readonly code: string;

  constructor(code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SolvraeError';
    this.code = code;
  }
}

/** A precondition for a command was not met (e.g. running `add` outside a repo). */
export class PreconditionError extends SolvraeError {
  constructor(message: string, options?: ErrorOptions) {
    super('PRECONDITION_FAILED', message, options);
    this.name = 'PreconditionError';
  }
}

/** Validation of external data (config, registry, flags) failed. */
export class ValidationError extends SolvraeError {
  constructor(message: string, options?: ErrorOptions) {
    super('VALIDATION_FAILED', message, options);
    this.name = 'ValidationError';
  }
}

/** Applying a plan failed; the executor attempts rollback before throwing this. */
export class ExecutionError extends SolvraeError {
  /** Whether rollback of already-applied actions succeeded. */
  readonly rolledBack: boolean;

  constructor(message: string, rolledBack: boolean, options?: ErrorOptions) {
    super('EXECUTION_FAILED', message, options);
    this.name = 'ExecutionError';
    this.rolledBack = rolledBack;
  }
}
