/**
 * HTTP-слой: единственная точка выхода в сеть для сгенерированных клиентов.
 *
 * Здесь живёт то, чего нет в сгенерированном коде: таймаут, отмена вызывающего,
 * ретраи по 429/5xx с уважением к `Retry-After` (и к `X-Ratelimit-Retry`/`Reset`
 * через лимитер) и пауза лимитера перед запросом.
 *
 * Слой НЕ бросает на HTTP-ошибку: он отдаёт `Response` как есть, а маппинг в
 * `ApiError` делает вызывающий. Причина: генераторы оборачивают всё, что
 * брошено из `fetchApi`, в свою ошибку — и наш класс перестал бы быть собой.
 */
import type { RateLimiter } from './rate-limit';
/** Политика ретраев. */
export interface RetryPolicy {
    /** Число ПОВТОРОВ (не всего попыток). 0 — не повторять. */
    max: number;
    baseDelayMs: number;
    /** Повторять только идемпотентные методы (GET/HEAD/PUT/DELETE/OPTIONS). */
    idempotentOnly: boolean;
}
export declare const DEFAULT_RETRY: RetryPolicy;
export declare const DEFAULT_TIMEOUT_MS = 60000;
/** Тот же шов, что ждёт генератор (`FetchAPI`). */
export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export interface HttpFetchOptions {
    fetch: typeof globalThis.fetch;
    timeoutMs?: number;
    retry?: Partial<RetryPolicy>;
    /** Пауза зависит от заголовков вендора; без лимитера — только бэкофф. */
    limiter?: RateLimiter;
    /** Хост для бакета лимитера. */
    host?: string;
    /** Инъекция времени (тесты). */
    now?: () => number;
    /** Инъекция ожидания: тесты не должны спать по-настоящему. */
    sleep?: (ms: number) => Promise<void>;
}
export interface HttpFetchState {
    /** Последняя увиденная пауза из `Retry-After`/429 — для наблюдаемости. */
    retryAfterMs: number | undefined;
    /** Сколько раз ответ просил подождать. */
    retried: number;
}
export interface HttpFetch {
    fetch: FetchLike;
    readonly state: HttpFetchState;
}
export declare function createHttpFetch(options: HttpFetchOptions): HttpFetch;
