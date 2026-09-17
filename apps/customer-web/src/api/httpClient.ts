import { sessionStorage } from '../auth/sessionStorage';
import { ApiError } from './errors';
import type { ApiEnvelope } from './types';

export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async getEnvelope<T>(path: string): Promise<ApiEnvelope<T>> {
    return this.requestEnvelope<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const payload = await this.requestEnvelope<T>(path, init);
    return payload.data;
  }

  private async requestEnvelope<T>(path: string, init: RequestInit): Promise<ApiEnvelope<T>> {
    const token = sessionStorage.get()?.accessToken;
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });

    const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
    if (!response.ok || !payload?.success) {
      const errorPayload = payload as (ApiEnvelope<null> & { error?: { code?: string; details?: unknown } }) | null;
      throw new ApiError(
        payload?.message ?? 'The request could not be completed.',
        response.status,
        errorPayload?.error?.code ?? 'API_ERROR',
        errorPayload?.error?.details,
      );
    }
    return payload;
  }
}
