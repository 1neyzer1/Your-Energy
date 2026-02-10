const BASE_URL = 'https://your-energy.b.goit.study/api';
const DEFAULT_TIMEOUT_MS = 10000;

const buildUrl = (path, params = {}) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${BASE_URL}${normalizedPath}`);
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.set(key, value);
  });

  const query = searchParams.toString();
  if (query) {
    url.search = query;
  }

  return url.toString();
};

export const fetchJson = async (
  path,
  { params, signal, timeoutMs = DEFAULT_TIMEOUT_MS, ...options } = {}
) => {
  const url = buildUrl(path, params);
  const controller = new AbortController();
  const headers = new Headers(options.headers || {});
  const hasBody = options.body !== undefined && options.body !== null;
  let didTimeout = false;

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  const timeoutId =
    timeoutMs && Number.isFinite(timeoutMs)
      ? setTimeout(() => {
          didTimeout = true;
          controller.abort();
        }, timeoutMs)
      : null;

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (error?.name === 'AbortError') {
      if (didTimeout) {
        const timeoutError = new Error('Request timed out.');
        timeoutError.name = 'TimeoutError';
        throw timeoutError;
      }
    }
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }

  const contentType = response.headers.get('content-type') || '';
  let data = null;

  if (response.status !== 204) {
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      data = await response.text().catch(() => null);
    }
  }

  if (!response.ok) {
    const dataSnippet =
      typeof data === 'string'
        ? data.slice(0, 200)
        : data && typeof data === 'object'
        ? JSON.stringify(data).slice(0, 200)
        : '';
    const message =
      (data && typeof data === 'object' && data.message) ||
      dataSnippet ||
      response.statusText ||
      'Request failed';
    const error = new Error(`${message} (status ${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const getQuote = (options = {}) => fetchJson('/quote', options);

export const getFilters = ({
  filter,
  page = 1,
  limit = 12,
  signal,
  timeoutMs,
} = {}) =>
  fetchJson('/filters', { params: { filter, page, limit }, signal, timeoutMs });

export const getExercises = ({
  page = 1,
  limit = 8,
  signal,
  timeoutMs,
  ...params
} = {}) =>
  fetchJson('/exercises', {
    params: { ...params, page, limit },
    signal,
    timeoutMs,
  });

export const getExerciseById = (exerciseId, options = {}) =>
  fetchJson(`/exercises/${exerciseId}`, options);

export const patchExerciseRating = (exerciseId, payload, options = {}) =>
  fetchJson(`/exercises/${exerciseId}/rating`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    ...options,
  });

export const postSubscription = (email, options = {}) =>
  fetchJson('/subscription', {
    method: 'POST',
    body: JSON.stringify({ email }),
    ...options,
  });
