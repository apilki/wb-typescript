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
/** Причина по коду ответа — формулировки из доки вендора, а не «HTTP 403». */
const STATUS_REASONS = {
    400: 'неправильный запрос: проверьте синтаксис и типы параметров',
    401: 'не авторизован: токен отсутствует, просрочен или некорректен',
    402: 'требуется платёж: ошибка только для сервисов из Каталога решений',
    403: 'доступ запрещён: категория токена не совпала с сервисом, метод не разрешён типу токена, пользователь удалён или метод заблокирован',
    404: 'не найдено: проверьте URL и идентификаторы в пути',
    409: 'конфликт состояния: часть объектов не сохранилась или статус не обновлён',
    413: 'превышен объём запроса: уменьшите число объектов в теле',
    422: 'противоречивые параметры: данные запроса не согласованы между собой',
    429: 'превышен лимит запросов: повторите позже',
};
export class WbApiError extends ApiError {
    constructor(init) {
        super({
            status: init.status,
            reason: init.reason,
            detail: init.detail,
            hint: init.hint,
            retryAfterSeconds: init.retryAfterSeconds,
            body: init.body,
        });
        this.name = 'WbApiError';
        this.envelope = init.envelope;
        this.additionalErrors = init.additionalErrors;
    }
}
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const asText = (value) => {
    if (typeof value === 'string' && value.trim())
        return value.trim();
    return undefined;
};
function reasonFor(status) {
    if (STATUS_REASONS[status])
        return STATUS_REASONS[status];
    if (status >= 500)
        return 'внутренняя ошибка сервиса WB: повторите позже';
    return 'неизвестный код ответа';
}
/**
 * Разбирает тело ошибки и статус в `WbApiError`. Принимает распарсенный JSON
 * либо сырой текст (шлюз иногда отдаёт html/plain).
 *
 * Поле `details` в ошибках 404/429 вендор наполняет подсказкой по использованию
 * методов — сохраняем его отдельно, а не только в тексте.
 */
export function parseError(status, body, { retryAfterSeconds } = {}) {
    const base = { status, retryAfterSeconds, body };
    if (isRecord(body)) {
        // шлюзовый конверт
        if ('title' in body || 'statusText' in body) {
            return new WbApiError({
                ...base,
                envelope: 'gateway',
                reason: reasonFor(status),
                detail: asText(body.title) ?? asText(body.statusText),
                hint: asText(body.detail),
            });
        }
        // конверт метода
        if ('error' in body || 'errorText' in body || 'data' in body) {
            return new WbApiError({
                ...base,
                envelope: 'method',
                reason: reasonFor(status),
                detail: asText(body.errorText),
                hint: asText(body.details) ?? asText(body.detail),
                additionalErrors: body.additionalErrors ?? undefined,
            });
        }
        return new WbApiError({
            ...base,
            envelope: 'plain',
            reason: reasonFor(status),
            hint: asText(body.details) ?? asText(body.detail),
        });
    }
    const text = asText(body);
    return new WbApiError({
        ...base,
        envelope: text ? 'plain' : 'empty',
        reason: reasonFor(status),
        detail: text ? text.slice(0, 500) : undefined,
    });
}
/** Успех по статусу + разбор тела; иначе бросает `WbApiError`. */
export function unwrapResponse(status, text, options = {}) {
    const body = parseBody(text);
    if (status >= 200 && status < 300)
        return body;
    throw parseError(status, body, options);
}
/** Поле `data` из конверта метода: методы WB заворачивают полезное в него. */
export function unwrapData(body) {
    if (isRecord(body) && 'data' in body)
        return body.data;
    return body;
}
