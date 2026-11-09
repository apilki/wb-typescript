/**
 * Лимитер WB = общий лимитер ядра.
 *
 * Заголовки `X-Ratelimit-*` — те же имена по умолчанию, поэтому вендорской
 * обёртки не нужно: `RateLimiter` из `@apilki/core` уже читает `Remaining`,
 * `Limit`, `Reset`, `Retry`, списывает 10 единиц за 4XX и держит дефолтную
 * паузу, когда заголовков нет.
 *
 * Модуль оставлен ради стабильного пути импорта (`./rate-limit.ts`) и
 * совместимости с прежними именами.
 */
export { CLIENT_ERROR_COST, DEFAULT_PAUSE_MS, RateLimiter } from './shared/rate-limit';
export type { RateLimitHeaders, RateLimitState, RateLimiterOptions } from './shared/rate-limit';
