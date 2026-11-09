"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redact = exports.TOKEN_ENV = void 0;
exports.resolveToken = resolveToken;
exports.authHeaders = authHeaders;
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
const auth_1 = require("./shared/auth");
exports.TOKEN_ENV = 'WB_API_TOKEN';
/** Токен из явного конфига, иначе из окружения. Пустое значение = токена нет. */
function resolveToken(config = {}, env = process.env) {
    return (0, auth_1.resolveToken)({ token: config.token }, env, exports.TOKEN_ENV);
}
/** Заголовки авторизации для запроса. */
function authHeaders(token) {
    return (0, auth_1.authHeader)(token, 'raw');
}
/** Вырезание секретов — общее правило ядра, не вендорское. */
var errors_1 = require("./shared/errors");
Object.defineProperty(exports, "redact", { enumerable: true, get: function () { return errors_1.redact; } });
