/**
 * Сшивка ядра со сгенерированным кодом.
 *
 * Генератор даёт 13 независимых `Configuration` (по одной на раздел), ядро —
 * токен, песочницу, лимитер и разбор ошибок. Здесь они встречаются: один вызов
 * `configure(items.Configuration)` отдаёт готовый конфиг раздела.
 *
 * Транспорт (таймаут, отмена, повторы по `Retry-After`/`Retry` лимитера) —
 * общий, из `@apilki/core` (`./shared/http.ts`). Вендорское здесь: разбор JWT
 * до сети, песочница и карта хостов, два конверта ошибок WB.
 */
import { WbApiError } from './errors';
import { RateLimiter } from './rate-limit';
import type { FetchLike } from './shared/http';
/** Минимум, который нужен от сгенерированного Configuration (typescript-fetch). */
export interface ConfigurationLike {
    basePath: string;
    /** Сгенерированный Configuration отдаёт токен строкой или функцией (геттер). */
    apiKey?: string | (() => string | undefined);
}
export type ConfigurationCtor<T extends ConfigurationLike> = new (options: Record<string, unknown>) => T;
export interface ClientOptions {
    /** Токен явно; иначе берётся из окружения (`WB_API_TOKEN`). */
    token?: string;
    /** Подставить `*-sandbox`-двойник хоста раздела. */
    sandbox?: boolean;
    /** Другой источник окружения (тесты). */
    env?: Record<string, string | undefined>;
    /** Общий лимитер на несколько разделов. */
    limiter?: RateLimiter;
    /** Подмена сети: тесты и свои транспорты. */
    fetchApi?: FetchLike;
    /** Своя база вместо BASE_PATH раздела (прокси, стенд). */
    basePath?: string;
    /** Подмена ожидания: тесты не должны спать по-настоящему. */
    sleep?: (ms: number) => Promise<void>;
    /** Инъекция времени (тесты дедлайнов лимитера). */
    now?: () => number;
    /** Таймаут запроса, мс. */
    timeoutMs?: number;
}
export interface WiredConfiguration<T extends ConfigurationLike> {
    config: T;
    limiter: RateLimiter;
}
/**
 * Готовый конфиг раздела: токен в заголовке, база с учётом песочницы, каждый
 * запрос проходит через лимитер и общий транспорт (повтор после 429).
 */
export declare function configure<T extends ConfigurationLike>(Ctor: ConfigurationCtor<T>, options?: ClientOptions): WiredConfiguration<T>;
/**
 * Ошибка сгенерированного клиента → `WbApiError` (два конверта вендора).
 * Сетевые сбои приходят без статуса — отдаём их как «шлюз недоступен».
 */
export declare function toWbError(error: unknown): WbApiError;
