"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = exports.DEFAULT_PAUSE_MS = exports.CLIENT_ERROR_COST = void 0;
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
var rate_limit_1 = require("./shared/rate-limit");
Object.defineProperty(exports, "CLIENT_ERROR_COST", { enumerable: true, get: function () { return rate_limit_1.CLIENT_ERROR_COST; } });
Object.defineProperty(exports, "DEFAULT_PAUSE_MS", { enumerable: true, get: function () { return rate_limit_1.DEFAULT_PAUSE_MS; } });
Object.defineProperty(exports, "RateLimiter", { enumerable: true, get: function () { return rate_limit_1.RateLimiter; } });
