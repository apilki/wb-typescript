"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpFetch = exports.DEFAULT_TIMEOUT_MS = exports.DEFAULT_RETRY = exports.RateLimiter = exports.DEFAULT_PAUSE_MS = exports.CLIENT_ERROR_COST = exports.toApiError = exports.redact = exports.reasonFor = exports.parseBody = exports.errorFromResponse = exports.ApiError = exports.resolveToken = exports.authHeader = exports.CORE_VERSION = void 0;
/**
 * `@apilki/core` — общее рукописное ядро клиентов @apilki.
 *
 * Четыре модуля: `auth`, `http`, `errors`, `rate-limit`. Ядро не знает ни одного
 * вендора: конверты ошибок, разбор токенов и песочницы живут в клиентах.
 */
exports.CORE_VERSION = '0.1.0';
var auth_1 = require("./auth");
Object.defineProperty(exports, "authHeader", { enumerable: true, get: function () { return auth_1.authHeader; } });
Object.defineProperty(exports, "resolveToken", { enumerable: true, get: function () { return auth_1.resolveToken; } });
var errors_1 = require("./errors");
Object.defineProperty(exports, "ApiError", { enumerable: true, get: function () { return errors_1.ApiError; } });
Object.defineProperty(exports, "errorFromResponse", { enumerable: true, get: function () { return errors_1.errorFromResponse; } });
Object.defineProperty(exports, "parseBody", { enumerable: true, get: function () { return errors_1.parseBody; } });
Object.defineProperty(exports, "reasonFor", { enumerable: true, get: function () { return errors_1.reasonFor; } });
Object.defineProperty(exports, "redact", { enumerable: true, get: function () { return errors_1.redact; } });
Object.defineProperty(exports, "toApiError", { enumerable: true, get: function () { return errors_1.toApiError; } });
var rate_limit_1 = require("./rate-limit");
Object.defineProperty(exports, "CLIENT_ERROR_COST", { enumerable: true, get: function () { return rate_limit_1.CLIENT_ERROR_COST; } });
Object.defineProperty(exports, "DEFAULT_PAUSE_MS", { enumerable: true, get: function () { return rate_limit_1.DEFAULT_PAUSE_MS; } });
Object.defineProperty(exports, "RateLimiter", { enumerable: true, get: function () { return rate_limit_1.RateLimiter; } });
var http_1 = require("./http");
Object.defineProperty(exports, "DEFAULT_RETRY", { enumerable: true, get: function () { return http_1.DEFAULT_RETRY; } });
Object.defineProperty(exports, "DEFAULT_TIMEOUT_MS", { enumerable: true, get: function () { return http_1.DEFAULT_TIMEOUT_MS; } });
Object.defineProperty(exports, "createHttpFetch", { enumerable: true, get: function () { return http_1.createHttpFetch; } });
