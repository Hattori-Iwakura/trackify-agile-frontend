const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const json = await res.json();
    // Backend refresh returns only a new accessToken (no new refreshToken)
    const existingRefreshToken = getRefreshToken();
    setTokens(json.data.accessToken, existingRefreshToken || '');
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

async function handleTokenRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = refreshAccessToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && token) {
    const refreshed = await handleTokenRefresh();
    if (refreshed) {
      const newToken = getAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryRes = await fetch(`${API_URL}${endpoint}`, {
        ...rest,
        headers,
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      });
      if (!retryRes.ok) {
        if (retryRes.status === 401 && typeof window !== 'undefined') {
          clearTokens();
          window.location.href = '/login';
        }
        const error = await retryRes.json().catch(() => ({ message: 'Request failed' }));
        throw error;
      }
      if (retryRes.status === 204 || retryRes.headers.get('content-length') === '0') {
        return undefined as T;
      }
      const retryJson = await retryRes.json();
      return retryJson.data;
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Authentication failed');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw error;
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  const json = await res.json();
  return json.data;
}

export { clearTokens, setTokens, getAccessToken };
