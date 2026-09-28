# startbrain

Official JavaScript client for the public API of [Brain Security](https://startbrain.io) (startbrain.io), a cybersecurity awareness company (security awareness training for CISOs and their employees, plus AI literacy).

The API is public, read-only and needs no key. It returns the same data as the website: the product catalogue, use cases, public prices (EUR, excluding VAT) and languages. There is no write API.

- API documentation: https://startbrain.io/developers/
- OpenAPI 3.1 specification: https://startbrain.io/api/v1/openapi.json

## Install

```sh
npm install startbrain
```

Node 18 or later (built-in `fetch`), or any modern browser. ES module only (`import`, no `require`). No dependencies.

## Usage

```js
import { createClient } from 'startbrain';

const brain = createClient();

const { data: products } = await brain.listProducts({ lang: 'en-us', theme: 'cyber' });
const { data: cyberCup } = await brain.getProduct('cyber-cup', { lang: 'en-us' });
const pricing = await brain.getPricing();
```

| Method | Endpoint |
|---|---|
| `listProducts({ lang, theme, status, ids, limit, offset, cursor })` | `GET /api/v1/products` |
| `getProduct(idOrSlug, { lang })` | `GET /api/v1/products/{id}` |
| `listUseCases({ lang })` | `GET /api/v1/use-cases` |
| `getPricing()` | `GET /api/v1/pricing` |
| `listLanguages()` | `GET /api/v1/languages` |
| `getOpenAPI()` | `GET /api/v1/openapi.json` |

Languages: `fr`, `en-us`, `en-gb`, `de`, `es`, `it`, `nl`, `pt`. Pass `lang` explicitly: without it the API falls back on the `Accept-Language` header, then on `fr`.

HTTP errors are thrown as `StartbrainError`, with the HTTP `status` and the RFC 9457 `problem` document returned by the API. Network errors are thrown as is by `fetch`.

## License

MIT, Brain Security SAS.
