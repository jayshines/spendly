const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "spendly-token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

// Fired on any 401 so the auth provider can sign the user out.
export const UNAUTHORIZED_EVENT = "spendly:unauthorized";

export async function api<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const { json, headers, ...rest } = init;
  const token = tokenStore.get();

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...rest,
      headers: {
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Is the API running?");
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    // Nest returns message as a string or an array of validation messages
    const msg = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? "Something went wrong");
    if (res.status === 401 && token) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(res.status, msg);
  }
  return body as T;
}
