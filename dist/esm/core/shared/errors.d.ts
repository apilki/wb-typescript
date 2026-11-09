/**
 * Ошибки: один класс на пять вендоров и вырезание секретов из текста.
 *
 * Конверты ошибок у вендоров разные, и разбирает их клиент (там, где знают
 * форму). Ядро даёт то, что нужно всем: класс с полями, которые реально
 * используются в коде (`status`, `retryable`, `retryAfterSeconds`, сырое тело),
 * и `redact` — токен не должен попадать в логи и тексты ошибок, даже если
 * вендор эхом вернул заголовок запроса.
 */
/**
 * Вырезает похожие на секрет строки из текста, который уходит в логи/ошибки.
 * Сначала заголовок целиком (иначе сырой ключ без схемы не узнать), потом JWT
 * и `Bearer`, потом длинные непрозрачные строки.
 */
export declare function redact(text: string): string;
export declare function reasonFor(status: number): string;
export interface ApiErrorInit {
    status: number;
    /** Вендорская формулировка причины; по умолчанию — общая по коду ответа. */
    reason?: string | null;
    /** Машинный код вендора, если он его дал. */
    code?: string | null;
    detail?: string | null;
    hint?: string | null;
    retryAfterSeconds?: number | null;
    body?: unknown;
}
export declare class ApiError extends Error {
    readonly status: number;
    readonly code: string | null;
    readonly detail: string | null;
    readonly hint: string | null;
    readonly retryAfterSeconds: number | null;
    /** Сырое тело ответа — для диагностики; в текст ошибки не попадает. */
    readonly body: unknown;
    constructor(init: ApiErrorInit);
    /** Повтор имеет смысл: лимит или временная недоступность сервиса. */
    get retryable(): boolean;
}
/** Тело ответа → JSON. Пустое тело — не ошибка парсинга: часть методов успешна без тела. */
export declare function parseBody(text: string | null | undefined): unknown;
/**
 * Тело + статус → `ApiError`. Вытаскивает причину из общего набора ключей;
 * вендорские конверты (когда важно различать формы) разбирает клиент.
 */
export declare function toApiError(status: number, body: unknown, options?: {
    retryAfterSeconds?: number;
}): ApiError;
/**
 * Неуспешный HTTP-ответ → `ApiError`. Тело читается из клона: исходный
 * `Response` остаётся пригодным вызывающему.
 */
export declare function errorFromResponse(response: Response): Promise<ApiError>;
