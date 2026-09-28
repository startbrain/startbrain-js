// startbrain: official client for the Brain Security public API (https://startbrain.io/developers/).
// The API is read-only and needs no key: this client only sends GET requests, without credentials or cookies.

export const DEFAULT_BASE_URL = 'https://startbrain.io/api/v1';

// Error answers of the API are RFC 9457 problem+json documents, kept as-is on `problem`.
export class StartbrainError extends Error {
  constructor(status, problem) {
    super((problem && (problem.detail || problem.title)) || `HTTP ${status}: not a JSON response`);
    this.name = 'StartbrainError';
    this.status = status;
    this.problem = problem || null;
  }
}

export function createClient({ baseUrl = DEFAULT_BASE_URL, fetch: fetchImpl } = {}) {
  const base = baseUrl.replace(/\/+$/, '');

  async function get(path, params = {}) {
    const url = new URL(base + path);
    for (const [key, value] of Object.entries(params)) {
      if (value != null) url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }
    const res = await (fetchImpl || globalThis.fetch)(url, { headers: { accept: 'application/json' }, credentials: 'omit' });
    const body = await res.json().catch(() => null);
    if (!res.ok || body === null) throw new StartbrainError(res.status, body);
    return body;
  }

  return {
    // { lang, theme, status, ids, limit, offset, cursor } -> { data, lang, pagination }
    listProducts: (params = {}) => get('/products', params),
    // id or slug, e.g. 'cybercup' or 'cyber-cup' -> { data }
    getProduct: (idOrSlug, { lang } = {}) => {
      // same pattern as the API: anything else ('', '.', '..') would silently hit another endpoint
      if (!/^[a-z0-9-]{1,64}$/.test(idOrSlug)) return Promise.reject(new TypeError(`Invalid product id or slug: ${JSON.stringify(idOrSlug)}`));
      return get(`/products/${idOrSlug}`, { lang });
    },
    listUseCases: ({ lang } = {}) => get('/use-cases', { lang }),
    getPricing: () => get('/pricing'),
    listLanguages: () => get('/languages'),
    getOpenAPI: () => get('/openapi.json'),
  };
}
