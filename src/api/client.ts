import { ENV } from '../config/env';
import { getAuthToken } from '../storage/secureStore';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${ENV.API_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENV.REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    let body: any = null;
    const text = await res.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch (_e) {
        body = text;
      }
    }

    if (!res.ok) {
      const errorMessage =
        (body && body.error) ||
        (body && body.message) ||
        `HTTP request failed with status ${res.status}`;
      throw new ApiError(res.status, errorMessage, body);
    }

    return body as T;
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out');
    }
    throw error;
  }
}
