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
export interface RateLimitState {
    /** Сколько запросов доступно без паузы; null — вендор ещё не сказал. */
    remaining: number | null;
    /** Максимальный всплеск, который восстановится через resetSeconds. */
    limit: number | null;
    /** Через сколько секунд восстановится всплеск. */
    resetSeconds: number | null;
    /** Через сколько секунд разрешат повтор (приходит в 429). */
    retryAfterSeconds: number | null;
    /** Когда можно повторять, мс (абсолютный момент): заголовок — дедлайн, а не постоянная пауза. */
    retryAt: number | null;
    /** Когда восстановится всплеск, мс. */
    resetAt: number | null;
    /** Сколько раз мы упёрлись в 429 — для диагностики. */
    throttledCount: number;
    /** Вендор хоть раз назвал лимит; пока false — работает дефолтная политика. */
    known: boolean;
    /** Время последнего учтённого ответа, мс. */
    lastRequestAt: number | null;
}
/** Имена заголовков лимита. По умолчанию — как у WB; вендор может переопределить. */
export interface RateLimitHeaders {
    remaining: string;
    limit: string;
    reset: string;
    retry: string;
}
export interface RateLimiterOptions {
    /** Пауза между запросами, пока вендор молчит про лимиты. 0 — не ждать. */
    defaultPauseMs?: number;
    /** Инъекция времени (тесты). По умолчанию Date.now. */
    now?: () => number;
    headers?: Partial<RateLimitHeaders>;
}
/** 4XX съедает десять единиц квоты (так считает вендор), остальное — по одной. */
export declare const CLIENT_ERROR_COST = 10;
/** Пауза по умолчанию: два запроса в секунду. Медленно и безопасно. */
export declare const DEFAULT_PAUSE_MS = 500;
export declare class RateLimiter {
    private states;
    private readonly defaultPauseMs;
    private readonly now;
    private readonly headers;
    constructor(options?: RateLimiterOptions);
    private stateOf;
    /** Состояние бакета по умолчанию (без хоста) — совместимость и тесты. */
    get snapshot(): RateLimitState;
    snapshotFor(host: string): RateLimitState;
    /**
     * Учесть ответ сервера. `status` нужен, потому что 4XX стоит дороже, а 429
     * приносит Retry.
     */
    noteResponse(status: number, headers?: Record<string, string | undefined>, host?: string): RateLimitState;
    /**
     * Сколько миллисекунд ждать перед следующим запросом.
     * 0 — можно идти. 429 велит ждать `X-Ratelimit-Retry` ровно столько, сколько
     * сказал вендор: ранняя попытка всё равно получит 429.
     */
    delayMs(host?: string): number;
    /** Сброс состояния — нужен в тестах и при смене токена. */
    reset(host?: string): void;
}
