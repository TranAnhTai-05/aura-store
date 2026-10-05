/** The one place where the storefront talks to the server */

export type ApiSuccess<T> = { ok: true } & T;
export type ApiFailure = { ok: false; error: string; status: number };
export type ApiResult<T = {}> = ApiSuccess<T> | ApiFailure;

const OFFLINE = 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.';
const UNEXPECTED = 'Máy chủ gặp sự cố. Vui lòng thử lại sau.';

async function send<T>(method: string, url: string, body?: unknown): Promise<ApiResult<T>> {
  const isForm = body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      // Sends the session cookie. The cookie is httpOnly: this code never sees the token.
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'X-Aura-Client': 'web',
        ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: OFFLINE, status: 0 };
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // An empty or non-JSON body: the development proxy answers like this when the API is down
  }

  if (!response.ok) {
    const message = (data as { error?: unknown } | null)?.error;
    return {
      ok: false,
      status: response.status,
      error:
        typeof message === 'string' && message
          ? message
          : response.status >= 500
          ? OFFLINE
          : UNEXPECTED,
    };
  }

  return { ...((data ?? {}) as T), ok: true };
}

export const api = {
  get: <T>(url: string) => send<T>('GET', url),
  post: <T>(url: string, body: unknown = {}) => send<T>('POST', url, body),
  put: <T>(url: string, body: unknown = {}) => send<T>('PUT', url, body),
  patch: <T>(url: string, body: unknown = {}) => send<T>('PATCH', url, body),
  delete: <T>(url: string) => send<T>('DELETE', url),
};
