"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shared = exports.toWbError = exports.configure = exports.decodeToken = exports.assertToken = exports.TokenError = exports.READONLY_BIT = exports.CATEGORY_LABELS = exports.CATEGORY_BITS = exports.redact = exports.authHeaders = exports.resolveToken = exports.TOKEN_ENV = exports.unwrapResponse = exports.unwrapData = exports.parseError = exports.parseBody = exports.WbApiError = exports.resolveHost = exports.baseUrl = exports.SandboxError = exports.SANDBOX_HOSTS = exports.KNOWN_HOSTS = exports.RateLimiter = exports.CLIENT_ERROR_COST = exports.CORE_VERSION = void 0;
/**
 * Ядро клиента WB: авторизация и разбор JWT, конверты ошибок вендора,
 * лимитер по заголовкам, карта хостов, песочница.
 */
exports.CORE_VERSION = '0.3.5';
var rate_limit_1 = require("./rate-limit");
Object.defineProperty(exports, "CLIENT_ERROR_COST", { enumerable: true, get: function () { return rate_limit_1.CLIENT_ERROR_COST; } });
Object.defineProperty(exports, "RateLimiter", { enumerable: true, get: function () { return rate_limit_1.RateLimiter; } });
var hosts_1 = require("./hosts");
Object.defineProperty(exports, "KNOWN_HOSTS", { enumerable: true, get: function () { return hosts_1.KNOWN_HOSTS; } });
Object.defineProperty(exports, "SANDBOX_HOSTS", { enumerable: true, get: function () { return hosts_1.SANDBOX_HOSTS; } });
Object.defineProperty(exports, "SandboxError", { enumerable: true, get: function () { return hosts_1.SandboxError; } });
Object.defineProperty(exports, "baseUrl", { enumerable: true, get: function () { return hosts_1.baseUrl; } });
Object.defineProperty(exports, "resolveHost", { enumerable: true, get: function () { return hosts_1.resolveHost; } });
var errors_1 = require("./errors");
Object.defineProperty(exports, "WbApiError", { enumerable: true, get: function () { return errors_1.WbApiError; } });
Object.defineProperty(exports, "parseBody", { enumerable: true, get: function () { return errors_1.parseBody; } });
Object.defineProperty(exports, "parseError", { enumerable: true, get: function () { return errors_1.parseError; } });
Object.defineProperty(exports, "unwrapData", { enumerable: true, get: function () { return errors_1.unwrapData; } });
Object.defineProperty(exports, "unwrapResponse", { enumerable: true, get: function () { return errors_1.unwrapResponse; } });
var auth_1 = require("./auth");
Object.defineProperty(exports, "TOKEN_ENV", { enumerable: true, get: function () { return auth_1.TOKEN_ENV; } });
Object.defineProperty(exports, "resolveToken", { enumerable: true, get: function () { return auth_1.resolveToken; } });
Object.defineProperty(exports, "authHeaders", { enumerable: true, get: function () { return auth_1.authHeaders; } });
Object.defineProperty(exports, "redact", { enumerable: true, get: function () { return auth_1.redact; } });
var token_1 = require("./token");
Object.defineProperty(exports, "CATEGORY_BITS", { enumerable: true, get: function () { return token_1.CATEGORY_BITS; } });
Object.defineProperty(exports, "CATEGORY_LABELS", { enumerable: true, get: function () { return token_1.CATEGORY_LABELS; } });
Object.defineProperty(exports, "READONLY_BIT", { enumerable: true, get: function () { return token_1.READONLY_BIT; } });
Object.defineProperty(exports, "TokenError", { enumerable: true, get: function () { return token_1.TokenError; } });
Object.defineProperty(exports, "assertToken", { enumerable: true, get: function () { return token_1.assertToken; } });
Object.defineProperty(exports, "decodeToken", { enumerable: true, get: function () { return token_1.decodeToken; } });
var wiring_1 = require("./wiring");
Object.defineProperty(exports, "configure", { enumerable: true, get: function () { return wiring_1.configure; } });
Object.defineProperty(exports, "toWbError", { enumerable: true, get: function () { return wiring_1.toWbError; } });
/** Общая часть ядра (@apilki/core), вендорено в `shared/`: для клиентов, которым нужен модуль напрямую. */
exports.shared = require("./shared/index");
