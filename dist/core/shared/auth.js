"use strict";
/**
 * Токены: откуда взять и как положить в запрос.
 *
 * Вендоры расходятся в двух местах, и только в них: имя переменной окружения и
 * схема заголовка. WB требует HeaderApiKey (сырой токен в `Authorization`),
 * остальные — `Bearer`. Всё остальное (кэш, рефреш, разбор payload) — дело
 * клиента: у каждого вендора своя форма токена.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveToken = resolveToken;
exports.authHeader = authHeader;
/**
 * Окружение без зависимости от типов Node: ядро собирается и в браузерных
 * бандлах, где `process` нет вовсе.
 */
function envOrEmpty() {
    return globalThis.process?.env ?? {};
}
/** Токен из явного конфига, иначе из окружения. Пустое значение = токена нет. */
function resolveToken(config = {}, env = envOrEmpty(), envKey = 'API_TOKEN') {
    const fromConfig = typeof config.token === 'string' ? config.token.trim() : '';
    const fromEnv = typeof env[envKey] === 'string' ? env[envKey].trim() : '';
    return fromConfig || fromEnv;
}
/** Заголовок авторизации для запроса. Без токена заголовка нет: `Bearer ` в сеть не уходит. */
function authHeader(token, scheme = 'bearer') {
    const value = typeof token === 'string' ? token.trim() : '';
    if (!value)
        return {};
    return { Authorization: scheme === 'raw' ? value : `Bearer ${value}` };
}
