"use strict";
/**
 * Лимитер: слушает вендора, а не свою таблицу.
 *
 * Лимиты — token bucket, разные для каждого метода и типа токена, поэтому числа
 * в клиенте не зашиваются: вендор сообщает состояние заголовками. Но молчание
 * вендора НЕ значит «лимита нет»: без заголовков действует дефолтная политика
 * паузы (минимальный интервал между запросами), иначе первый же прогон по
 * сотне методов ловит 429 там, где его можно было не получать.
 *
 * Лимитер ничего не знает про сеть: ему отдают статус и заголовки ответа, он
 * говорит, сколько ждать перед следующим запросом.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = exports.DEFAULT_PAUSE_MS = exports.CLIENT_ERROR_COST = void 0;
/** 4XX съедает десять единиц квоты (так считает вендор), остальное — по одной. */
exports.CLIENT_ERROR_COST = 10;
/** Пауза по умолчанию: два запроса в секунду. Медленно и безопасно. */
exports.DEFAULT_PAUSE_MS = 500;
const DEFAULT_HEADERS = {
    remaining: 'x-ratelimit-remaining',
    limit: 'x-ratelimit-limit',
    reset: 'x-ratelimit-reset',
    retry: 'x-ratelimit-retry',
};
const emptyState = () => ({
    remaining: null,
    limit: null,
    resetSeconds: null,
    retryAfterSeconds: null,
    retryAt: null,
    resetAt: null,
    throttledCount: 0,
    known: false,
    lastRequestAt: null,
});
const headerValue = (headers, name) => {
    const lower = name.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === lower) {
            const text = String(value).trim();
            // Пустой заголовок — это «вендор промолчал», а не ноль.
            if (text === '')
                return null;
            const num = Number(text);
            return Number.isFinite(num) ? num : null;
        }
    }
    return null;
};
class RateLimiter {
    constructor(options = {}) {
        this.states = new Map();
        this.defaultPauseMs = options.defaultPauseMs ?? exports.DEFAULT_PAUSE_MS;
        this.now = options.now ?? (() => Date.now());
        this.headers = { ...DEFAULT_HEADERS, ...options.headers };
    }
    stateOf(host = '') {
        let state = this.states.get(host);
        if (!state) {
            state = emptyState();
            this.states.set(host, state);
        }
        return state;
    }
    /** Состояние бакета по умолчанию (без хоста) — совместимость и тесты. */
    get snapshot() {
        return { ...this.stateOf() };
    }
    snapshotFor(host) {
        return { ...this.stateOf(host) };
    }
    /**
     * Учесть ответ сервера. `status` нужен, потому что 4XX стоит дороже, а 429
     * приносит Retry.
     */
    noteResponse(status, headers = {}, host = '') {
        const state = this.stateOf(host);
        const remaining = headerValue(headers, this.headers.remaining);
        const limit = headerValue(headers, this.headers.limit);
        const reset = headerValue(headers, this.headers.reset);
        const retry = headerValue(headers, this.headers.retry);
        // Дефолтную политику выключает только то, из чего видно состояние квоты:
        // Limit сам по себе не говорит, сколько запросов осталось прямо сейчас.
        if (remaining !== null || reset !== null)
            state.known = true;
        const at = this.now();
        if (remaining !== null)
            state.remaining = remaining;
        else if (status >= 400 && status < 500 && status !== 429 && state.remaining !== null) {
            state.remaining = Math.max(0, state.remaining - exports.CLIENT_ERROR_COST);
        }
        else if (state.remaining !== null) {
            state.remaining = Math.max(0, state.remaining - 1);
        }
        if (limit !== null)
            state.limit = limit;
        if (reset !== null) {
            state.resetSeconds = reset;
            state.resetAt = reset > 0 ? at + reset * 1000 : null;
        }
        // Retry живёт ровно до своего момента: иначе после одного 429 клиент ждал
        // бы по протухшему заголовку ещё долго после восстановления квоты.
        if (retry !== null) {
            state.retryAfterSeconds = retry;
            state.retryAt = retry > 0 ? at + retry * 1000 : null;
        }
        else {
            // Свежий ответ без Retry-заголовка отменяет прошлый дедлайн: держать
            // протухшую паузу нельзя, иначе клиент ждёт по вчерашнему 429.
            state.retryAfterSeconds = null;
            state.retryAt = null;
        }
        if (status === 429) {
            state.throttledCount += 1;
            if (state.remaining === null || state.remaining > 0)
                state.remaining = 0;
        }
        state.lastRequestAt = at;
        return { ...state };
    }
    /**
     * Сколько миллисекунд ждать перед следующим запросом.
     * 0 — можно идти. 429 велит ждать `X-Ratelimit-Retry` ровно столько, сколько
     * сказал вендор: ранняя попытка всё равно получит 429.
     */
    delayMs(host = '') {
        const { remaining, retryAt, resetAt, known, lastRequestAt } = this.stateOf(host);
        if (remaining !== null && remaining > 0)
            return 0;
        if (retryAt !== null) {
            const left = retryAt - this.now();
            if (left > 0)
                return left;
        }
        // Квота выбрана целиком: она восстановится к Reset, ждём его остаток.
        if (remaining === 0 && resetAt !== null) {
            const left = resetAt - this.now();
            if (left > 0)
                return left;
        }
        // Вендор молчит: держим минимальный интервал между запросами.
        if (!known && lastRequestAt !== null && this.defaultPauseMs > 0) {
            const elapsed = this.now() - lastRequestAt;
            return elapsed >= this.defaultPauseMs ? 0 : this.defaultPauseMs - elapsed;
        }
        return 0;
    }
    /** Сброс состояния — нужен в тестах и при смене токена. */
    reset(host) {
        if (host === undefined)
            this.states.clear();
        else
            this.states.delete(host);
    }
}
exports.RateLimiter = RateLimiter;
