import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createClient, StartbrainError, DEFAULT_BASE_URL } from '../index.js';

// fake fetch: records every call and answers with the given status and body
function fakeFetch(status = 200, body = { data: [] }) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => { if (typeof body === 'string') throw new SyntaxError('not json'); return body; },
    };
  };
  fn.calls = calls;
  return fn;
}

test('talks to the official API on startbrain.io by default', async () => {
  // the package is the official SDK of startbrain.io: its default target must be the real public API
  assert.equal(DEFAULT_BASE_URL, 'https://startbrain.io/api/v1');
  const fetch = fakeFetch();
  await createClient({ fetch }).getPricing();
  assert.equal(fetch.calls[0].url.href, 'https://startbrain.io/api/v1/pricing');
});

test('only reads: no method override, no credentials, no API key', async () => {
  // the API is public and read-only; a client that sent a key or a write method would suggest otherwise
  const fetch = fakeFetch();
  const brain = createClient({ fetch });
  await brain.listProducts();
  await brain.getProduct('cyber-cup');
  await brain.listUseCases();
  await brain.getPricing();
  await brain.listLanguages();
  await brain.getOpenAPI();
  for (const { init } of fetch.calls) {
    assert.equal(init.method, undefined);
    assert.equal(init.credentials, 'omit');   // no cookie of startbrain.io, even from a same-origin page
    assert.deepEqual(Object.keys(init.headers), ['accept']);
  }
  assert.deepEqual(fetch.calls.map(c => c.url.pathname), [
    '/api/v1/products', '/api/v1/products/cyber-cup', '/api/v1/use-cases',
    '/api/v1/pricing', '/api/v1/languages', '/api/v1/openapi.json',
  ]);
});

test('forwards filters, joins ids and drops empty params', async () => {
  const fetch = fakeFetch();
  await createClient({ fetch }).listProducts({ lang: 'en-us', theme: 'cyber', ids: ['cybercup', 'superchallenge'], cursor: undefined, limit: 5 });
  const sp = fetch.calls[0].url.searchParams;
  assert.equal(sp.get('lang'), 'en-us');
  assert.equal(sp.get('theme'), 'cyber');
  assert.equal(sp.get('ids'), 'cybercup,superchallenge');
  assert.equal(sp.get('limit'), '5');
  assert.equal(sp.has('cursor'), false);
});

test('a product id cannot reach another endpoint', async () => {
  // '..' would return the API index and '' the product list, typed as one product: reject before any call
  const fetch = fakeFetch();
  const brain = createClient({ fetch });
  for (const bad of ['..', '.', '', '../pricing', 'Cyber Cup', 'a'.repeat(65)]) {
    await assert.rejects(brain.getProduct(bad), TypeError);
  }
  assert.equal(fetch.calls.length, 0);
  await brain.getProduct('cyber-cup', { lang: 'fr' });
  assert.equal(fetch.calls[0].url.pathname, '/api/v1/products/cyber-cup');
  assert.equal(fetch.calls[0].url.searchParams.get('lang'), 'fr');
});

test('API errors become StartbrainError with the problem+json document', async () => {
  const problem = { type: 'https://startbrain.io/api/v1/problems/not_found', title: 'Product not found', status: 404, detail: 'No product with id or slug "nope" in language fr.' };
  const brain = createClient({ fetch: fakeFetch(404, problem) });
  await assert.rejects(brain.getProduct('nope'), err => {
    assert.ok(err instanceof StartbrainError);
    assert.equal(err.status, 404);
    assert.equal(err.message, problem.detail);
    assert.deepEqual(err.problem, problem);
    return true;
  });
});

test('an error without a JSON body still reports the HTTP status', async () => {
  const brain = createClient({ fetch: fakeFetch(503, '<html>') });
  await assert.rejects(brain.getPricing(), { name: 'StartbrainError', status: 503, message: 'HTTP 503: not a JSON response' });
});

test('a 200 that is not JSON is an error, never a silent null', async () => {
  // e.g. a wrong baseUrl pointing at an HTML page: the caller must not get null typed as data
  const brain = createClient({ fetch: fakeFetch(200, '<html>') });
  await assert.rejects(brain.getPricing(), { name: 'StartbrainError', status: 200 });
});

test('custom base URL, trailing slash tolerated', async () => {
  const fetch = fakeFetch();
  await createClient({ baseUrl: 'http://localhost:8788/api/v1/', fetch }).listLanguages();
  assert.equal(fetch.calls[0].url.href, 'http://localhost:8788/api/v1/languages');
});

test('package metadata ties the package to startbrain.io and the startbrain GitHub org', () => {
  // this is how agents (and orank) verify that the package is the official SDK and not a look-alike
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  assert.equal(pkg.name, 'startbrain');
  assert.equal(new URL(pkg.homepage).hostname, 'startbrain.io');
  assert.equal(pkg.repository.url, 'git+https://github.com/startbrain/startbrain-js.git');
  assert.equal(pkg.bugs.url, 'https://github.com/startbrain/startbrain-js/issues');
  assert.deepEqual(pkg.files, ['index.js', 'index.d.ts']);
  assert.deepEqual(pkg.dependencies, undefined);
});
