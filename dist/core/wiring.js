"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.configure = configure;
exports.toWbError = toWbError;
const auth_1 = require("./auth");
const token_1 = require("./token");
const errors_1 = require("./errors");
const hosts_1 = require("./hosts");
const rate_limit_1 = require("./rate-limit");
const http_1 = require("./shared/http");
/** Повторяем ровно один раз: второй 429 отдаём вызывающему как ошибку. */
const WB_RETRY = { max: 1 };
/**
 * Готовый конфиг раздела: токен в заголовке, база с учётом песочницы, каждый
 * запрос проходит через лимитер и общий транспорт (повтор после 429).
 */
function configure(Ctor, options = {}) {
    const token = (0, auth_1.resolveToken)({ token: options.token, sandbox: options.sandbox }, options.env);
    if (!token)
        throw new Error(`нет токена WB: передайте options.token или переменную ${auth_1.TOKEN_ENV}`);
    // Разбор JWT до сети: 403 у вендора означает пять разных причин, а токен
    // разбирается локально. Подпись не проверяем — секрета у клиента нет.
    (0, token_1.assertToken)(token);
    if (options.basePath && options.sandbox) {
        throw new Error('basePath и sandbox взаимоисключающие: своя база уже задаёт, куда идти');
    }
    const limiterOptions = options.now ? { now: options.now } : {};
    const limiter = options.limiter ?? new rate_limit_1.RateLimiter(limiterOptions);
    const probe = new Ctor({});
    const base = options.basePath ??
        (options.sandbox ? (0, hosts_1.baseUrl)(new URL(probe.basePath).host, { sandbox: true }) : probe.basePath);
    const transport = (0, http_1.createHttpFetch)({
        fetch: options.fetchApi ?? ((url, init) => fetch(url, init)),
        limiter,
        host: new URL(base).host,
        retry: WB_RETRY,
        ...(options.sleep ? { sleep: options.sleep } : {}),
        ...(options.now ? { now: options.now } : {}),
        ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
    });
    // Тело ошибки разбираем ЗДЕСЬ и вешаем на сам Response: сгенерированный
    // рантайм бросает `ResponseError(response)` без тела, и детали конверта
    // вендора (detail, requestId) терялись — 401 без причины, 429 без паузы.
    // Бросать из fetchApi нельзя: рантайм заворачивает в `FetchError` и теряет
    // статус тоже. Тело читаем через clone(), чтобы не съесть его у вызывающего.
    const fetchApi = async (input, init) => {
        const response = await transport.fetch(input, init);
        if (response.ok)
            return response;
        const raw = await response.clone().text();
        let body = raw;
        if (!raw.trim())
            body = undefined;
        else {
            try {
                body = JSON.parse(raw);
            }
            catch {
                /* не JSON — отдаём текстом, как есть */
            }
        }
        const { retryAfterMs } = transport.state;
        Object.assign(response, {
            __wbBody: body,
            ...(retryAfterMs === undefined ? {} : { __wbRetryAfterSeconds: Math.ceil(retryAfterMs / 1000) }),
        });
        return response;
    };
    const config = new Ctor({ apiKey: token, basePath: base, fetchApi });
    // Сгенерированный Configuration прячет токен за геттером-функцией; принимаем оба вида.
    const accepted = config.apiKey;
    const kept = accepted === token || (typeof accepted === 'function' && accepted() === token);
    if (!kept) {
        throw new Error('Configuration не принял apiKey: у схемы раздела другое имя поля — токен ушёл бы не туда');
    }
    return { config, limiter };
}
/**
 * Ошибка сгенерированного клиента → `WbApiError` (два конверта вендора).
 * Сетевые сбои приходят без статуса — отдаём их как «шлюз недоступен».
 */
function toWbError(error) {
    if (error instanceof errors_1.WbApiError)
        return error;
    // `ResponseError` сгенерированного рантайма несёт только `response`; тело и
    // паузу туда положила сшивка (`__wbBody`, `__wbRetryAfterSeconds`).
    const shaped = error;
    const status = shaped?.response?.status;
    const stashed = shaped?.response?.__wbBody;
    const retryAfterSeconds = shaped?.response?.__wbRetryAfterSeconds;
    if (typeof status === 'number') {
        return (0, errors_1.parseError)(status, stashed ?? shaped?.body, {
            ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
        });
    }
    const text = error instanceof Error ? error.message : String(error);
    return (0, errors_1.parseError)(0, text);
}
