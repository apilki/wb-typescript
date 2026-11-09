/**
 * Токены: откуда взять и как положить в запрос.
 *
 * Вендоры расходятся в двух местах, и только в них: имя переменной окружения и
 * схема заголовка. WB требует HeaderApiKey (сырой токен в `Authorization`),
 * остальные — `Bearer`. Всё остальное (кэш, рефреш, разбор payload) — дело
 * клиента: у каждого вендора своя форма токена.
 */
/** `raw` — HeaderApiKey (WB), `bearer` — OAuth2-подобные (cdek, avito, ym). */
export type AuthScheme = 'raw' | 'bearer';
export interface AuthConfig {
    token?: string;
}
/** Токен из явного конфига, иначе из окружения. Пустое значение = токена нет. */
export declare function resolveToken(config?: AuthConfig, env?: Record<string, string | undefined>, envKey?: string): string;
/** Заголовок авторизации для запроса. Без токена заголовка нет: `Bearer ` в сеть не уходит. */
export declare function authHeader(token: string, scheme?: AuthScheme): Record<string, string>;
