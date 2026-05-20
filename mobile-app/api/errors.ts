const NETWORK_HINT =
  'Cannot reach the API. Start the backend (uvicorn main:app --reload) and check EXPO_PUBLIC_API_URL in mobile-app/.env.';

/** fetch wrapper that turns connection failures into a clear message. */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(NETWORK_HINT);
    }
    throw error;
  }
}

/** Turn FastAPI error bodies into a readable string for alerts and chat. */
export function formatApiError(detail: unknown, fallback: string): string {
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  if (Array.isArray(detail)) {
    const parts = detail.map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'msg' in item) {
        const loc = 'loc' in item && Array.isArray(item.loc)
          ? item.loc.join('.')
          : '';
        return loc ? `${loc}: ${String(item.msg)}` : String(item.msg);
      }
      return JSON.stringify(item);
    });
    if (parts.length) return parts.join('\n');
  }
  if (detail && typeof detail === 'object') {
    return JSON.stringify(detail);
  }
  return fallback;
}
