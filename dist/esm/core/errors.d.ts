/**
 * Ошибки WB: у вендора ДВА разных конверта, и путать их нельзя.
 *
 * 1. Конверт метода (почти все методы):
 *    `{ data, error: boolean, errorText: string, additionalErrors }`
 * 2. Шлюзовый конверт (404/429 и прочее, что отдаёт край):
 *    `{ title, detail, status, statusText, timestamp }`
 *
 * Если разбирать только первый, потребитель на шлюзовой ошибке получает
 * `undefined` в поле текста и теряет причину.
 *
 * Разбор конвертов — вендорский, он остаётся здесь. Общая часть — в
 * `@apilki/core`: один класс `ApiError` (статус, `retryable`, `body`,
 * редактирование секретов) и правило `redact`. Текст вендора иногда эхом
 * возвращает заголовки запроса, и токен не должен попасть в логи.
 */
import { ApiError, parseBody } from './shared/errors';
/** Тело ответа → JSON; пустое тело — не ошибка парсинга. */
export { parseBody };
export type ErrorEnvelope = 'method' | 'gateway' | 'plain' | 'empty';
export interface WbApiErrorInit {
    status: number;
    envelope: ErrorEnvelope;
    /** Вендорская формулировка причины (из таблицы кодов в доке). */
    reason: string;
    detail?: string;
    hint?: string;
    additionalErrors?: unknown;
    retryAfterSeconds?: number;
    body?: unknown;
}
export declare class WbApiError extends ApiError {
    /** Форма конверта вендора, из которой собрана ошибка. */
    readonly envelope: ErrorEnvelope;
    /** `additionalErrors` конверта метода — как есть, для программной обработки. */
    readonly additionalErrors: unknown;
    constructor(init: WbApiErrorInit);
}
/**
 * Разбирает тело ошибки и статус в `WbApiError`. Принимает распарсенный JSON
 * либо сырой текст (шлюз иногда отдаёт html/plain).
 *
 * Поле `details` в ошибках 404/429 вендор наполняет подсказкой по использованию
 * методов — сохраняем его отдельно, а не только в тексте.
 */
export declare function parseError(status: number, body: unknown, { retryAfterSeconds }?: {
    retryAfterSeconds?: number;
}): WbApiError;
/** Успех по статусу + разбор тела; иначе бросает `WbApiError`. */
export declare function unwrapResponse(status: number, text: string | null | undefined, options?: {
    retryAfterSeconds?: number;
}): unknown;
/** Поле `data` из конверта метода: методы WB заворачивают полезное в него. */
export declare function unwrapData<T = unknown>(body: unknown): T;
