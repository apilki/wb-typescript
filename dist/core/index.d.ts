/**
 * Ядро клиента WB: авторизация и разбор JWT, конверты ошибок вендора,
 * лимитер по заголовкам, карта хостов, песочница.
 */
export declare const CORE_VERSION = "0.3.5";
export { CLIENT_ERROR_COST, RateLimiter, } from './rate-limit';
export type { RateLimitState } from './rate-limit';
export { KNOWN_HOSTS, SANDBOX_HOSTS, SandboxError, baseUrl, resolveHost, } from './hosts';
export type { HostOptions } from './hosts';
export { WbApiError, parseBody, parseError, unwrapData, unwrapResponse, } from './errors';
export type { ErrorEnvelope, WbApiErrorInit } from './errors';
export { TOKEN_ENV, resolveToken, authHeaders, redact } from './auth';
export type { AuthConfig } from './auth';
export { CATEGORY_BITS, CATEGORY_LABELS, READONLY_BIT, TokenError, assertToken, decodeToken, } from './token';
export type { Category, DecodedToken, TokenRequirement, TokenType } from './token';
export { configure, toWbError } from './wiring';
export type { ClientOptions, ConfigurationCtor, ConfigurationLike, WiredConfiguration } from './wiring';
/** Общая часть ядра (@apilki/core), вендорено в `shared/`: для клиентов, которым нужен модуль напрямую. */
export * as shared from './shared/index';
