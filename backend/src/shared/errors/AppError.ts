export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'INVALID_STATE_TRANSITION'
  | 'QUOTA_EXCEEDED'
  | 'RATE_LIMITED'
  | 'TOKEN_EXPIRED'
  | 'STALE_VERSION'
  | 'CONNECTION_ALREADY_EXISTS'
  | 'AUTH_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: any;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: any) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  public toResponse() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Invalid request input', details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(401, 'AUTH_ERROR', message, details);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Access token expired') {
    super(401, 'TOKEN_EXPIRED', message);
  }
}

export class PermissionDeniedError extends AppError {
  constructor(message: string = 'Permission denied for this resource or operation') {
    super(403, 'PERMISSION_DENIED', message);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string = 'Organization plan tier quota exceeded') {
    super(403, 'QUOTA_EXCEEDED', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(message: string = 'Invalid lifecycle state transition') {
    super(409, 'INVALID_STATE_TRANSITION', message);
  }
}

export class StaleVersionError extends AppError {
  constructor(message: string = 'Concurrent update collision: stale expectedVersion', details?: any) {
    super(409, 'STALE_VERSION', message, details);
  }
}

export class ConnectionAlreadyExistsError extends AppError {
  constructor(message: string = 'Connection request already exists with this partner organization', details?: any) {
    super(409, 'CONNECTION_ALREADY_EXISTS', message, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests; rate limit exceeded') {
    super(429, 'RATE_LIMITED', message);
  }
}
