export declare const DEFAULT_BASE_URL: string;

export type Lang = 'fr' | 'en-us' | 'en-gb' | 'de' | 'es' | 'it' | 'nl' | 'pt';

export interface Problem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

export declare class StartbrainError extends Error {
  constructor(status: number, problem: Problem | null);
  status: number;
  problem: Problem | null;
}

export interface Pagination {
  limit: number;
  offset: number;
  total: number;
  next: string | null;
  prev: string | null;
  next_cursor?: string | null;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  lang: Lang;
  url: string;
  category: string;
  format: string;
  tagline: string;
  status: 'open' | 'signup_closed' | 'coming_soon';
  themes: Array<'cyber' | 'ia'>;
  app_url: string | null;
  links: Record<string, string>;
}

export interface Product extends ProductSummary {
  description: string;
  features: Array<{ title: string; description: string }>;
  specs: Array<{ name: string; value: string }>;
  stats: Array<{ value: string; label: string }>;
  faq: Array<{ question: string; answer: string }>;
  use_cases: string[];
  alternates: Partial<Record<Lang, string>>;
}

export interface UseCase {
  id: string;
  title: string;
  description: string;
  products: string[];
  links: Record<string, string>;
}

export interface Offer {
  id: string;
  name: string;
  price: number;
  priceCurrency: string;
  unit?: string;
  kind?: string;
}

export interface Pricing {
  currency: string;
  vat: string;
  source?: string;
  offers: Offer[];
  notes?: string[];
  links: Record<string, string>;
}

export interface ListProductsParams {
  lang?: Lang;
  theme?: 'cyber' | 'ia';
  status?: 'open' | 'signup_closed' | 'coming_soon';
  ids?: string | string[];
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface Client {
  listProducts(params?: ListProductsParams): Promise<{ data: ProductSummary[]; lang: Lang; pagination: Pagination }>;
  getProduct(idOrSlug: string, options?: { lang?: Lang }): Promise<{ data: Product }>;
  listUseCases(options?: { lang?: Lang }): Promise<{ data: UseCase[]; lang: Lang; pagination: Pagination }>;
  getPricing(): Promise<Pricing>;
  listLanguages(): Promise<{ data: Array<{ code: Lang; label: string; home: string }> }>;
  getOpenAPI(): Promise<Record<string, unknown>>;
}

export declare function createClient(options?: { baseUrl?: string; fetch?: typeof fetch }): Client;
