const BASE_URL = 'https://your-energy.b.goit.study/api';

const buildUrl = (path, params = {}) => {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    url.searchParams.set(key, value);
  });
  return url.toString();
};

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => 'Request failed');
    throw new Error(message || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const getQuote = () => request(buildUrl('/quote'));

export const getFilters = ({ filter, page = 1, limit = 6 } = {}) =>
  request(buildUrl('/filters', { filter, page, limit }));

export const getExercises = ({ page = 1, limit = 8, ...params } = {}) =>
  request(buildUrl('/exercises', { ...params, page, limit }));

export const getExerciseById = exerciseId =>
  request(buildUrl(`/exercises/${exerciseId}`));

export const patchExerciseRating = (exerciseId, payload) =>
  request(buildUrl(`/exercises/${exerciseId}/rating`), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const postSubscription = email =>
  request(buildUrl('/subscription'), {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
