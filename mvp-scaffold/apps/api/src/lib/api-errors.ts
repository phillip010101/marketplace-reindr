export type ApiErrorPayload = {
  code: string;
  message: string;
  fields?: Record<string, unknown>;
};

export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 503;

export class ApiRequestError extends Error {
  status: ApiErrorStatus;
  payload: ApiErrorPayload;

  constructor(status: ApiErrorStatus, payload: ApiErrorPayload) {
    super(payload.message);
    this.status = status;
    this.payload = payload;
  }
}

export function errorResponse(status: ApiErrorStatus, payload: ApiErrorPayload) {
  return {
    status,
    body: {
      ok: false as const,
      error: payload
    }
  };
}
