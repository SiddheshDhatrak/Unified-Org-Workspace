/**
 * Normalised Domain Error Envelope Representation (§21.3)
 * Mapped 1:1 from Backend PRD §18.1's uniform error shape.
 */

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, any>;
  public readonly requestId?: string;

  constructor(message: string, code = 'INTERNAL_ERROR', status = 500, details?: Record<string, any>, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }

  static fromResponse(body: any, status: number, headers: Headers): ApiError {
    const errorData = body?.error || body;
    const message = errorData?.message || 'An unexpected request error occurred';
    const code = errorData?.code || `HTTP_${status}`;
    const details = errorData?.details;
    const requestId = headers.get('x-request-id') || errorData?.requestId || undefined;

    return new ApiError(message, code, status, details, requestId);
  }
}
