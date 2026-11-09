/**
 * Где взять токен WB и как положить его в запрос.
 *
 * Общие правила живут в `@apilki/core` (`./shared/auth.ts`): порядок «конфиг →
 * окружение», срезание пробелов, схема заголовка. Здесь только вендорская
 * привязка: своё имя переменной окружения и HeaderApiKey вместо `Bearer`.
 *
 * Токен WB — обычный `HeaderApiKey`: заголовок `Authorization` с самим токеном,
 * без схемы. В логи и тексты ошибок он не попадает (`redact`).
 */
import { authHeader, resolveToken as resolveSharedToken } from './shared/auth';
export const TOKEN_ENV = 'WB_API_TOKEN';
/** Токен из явного конфига, иначе из окружения. Пустое значение = токена нет. */
export function resolveToken(config = {}, env = process.env) {
    return resolveSharedToken({ token: config.token }, env, TOKEN_ENV);
}
/** Заголовки авторизации для запроса. */
export function authHeaders(token) {
    return authHeader(token, 'raw');
}
/** Вырезание секретов — общее правило ядра, не вендорское. */
export { redact } from './shared/errors';
