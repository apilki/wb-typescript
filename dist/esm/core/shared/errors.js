/**
 * Ошибки: один класс на пять вендоров и вырезание секретов из текста.
 *
 * Конверты ошибок у вендоров разные, и разбирает их клиент (там, где знают
 * форму). Ядро даёт то, что нужно всем: класс с полями, которые реально
 * используются в коде (`status`, `retryable`, `retryAfterSeconds`, сырое тело),
 * и `redact` — токен не должен попадать в логи и тексты ошибок, даже если
 * вендор эхом вернул заголовок запроса.
 */
/** Заголовок с секретом: `Authorization: xxx`, `X-Api-Key: xxx`, в т.ч. без схемы. */
const AUTH_HEADER_RE = /\b(Authorization|X-Api-Key|Api-Key|Client-Secret|X-Auth-Token)\s*([:=])\s*(?:(Bearer|Basic|Token)\s+)?[^\s,;]+/gi;
/** Поле с секретом без имени заголовка: `"token": "..."`, `client_secret=...`. */
const SECRET_FIELD_RE = /\b(token|access_token|refresh_token|api[_-]?key|secret|client_secret|password)\b(["']?\s*[:=]\s*["']?)[A-Za-z0-9._~+/=-]{4,}/gi;
/** JWT: три base64url-части через точку. */
const JWT_RE = /[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+/g;
/** Значение схемы авторизации: `Bearer xxx`, `Basic xxx`, `Token xxx`. */
const SCHEME_RE = /\b(Bearer|Basic|Token)\s+[A-Za-z0-9._~+/=-]{4,}/gi;
/** Длинная непрозрачная строка: API-ключи, хэши, подписи. */
const OPAQUE_RE = /[A-Za-z0-9._~+/=-]{32,}/g;
/**
 * Вырезает похожие на секрет строки из текста, который уходит в логи/ошибки.
 * Сначала заголовок целиком (иначе сырой ключ без схемы не узнать), потом JWT
 * и `Bearer`, потом длинные непрозрачные строки.
 */
export function redact(text) {
    return String(text)
        .replace(AUTH_HEADER_RE, (_match, key, sep, scheme) => `${key}${sep} ${scheme ? `${scheme} ` : ''}<token>`)
        .replace(SECRET_FIELD_RE, (_match, key, sep) => `${key}${sep}<token>`)
        .replace(JWT_RE, '<token>')
        .replace(SCHEME_RE, (_match, scheme) => `${scheme} <token>`)
        .replace(OPAQUE_RE, '<token>');
}
/** Предел текста причины/подсказки: тело вендора иногда весит килобайты. */
const MAX_TEXT = 500;
/** Причина по коду ответа — общей формулировкой, без вендорских деталей. */
const STATUS_REASONS = {
    400: 'неправильный запрос: проверьте синтаксис и типы параметров',
    401: 'не авторизован: токен отсутствует, просрочен или некорректен',
    402: 'требуется платёж',
    403: 'доступ запрещён: прав токена не хватает для этого метода',
    404: 'не найдено: проверьте URL и идентификаторы в пути',
    409: 'конфликт состояния: часть объектов не сохранилась',
    413: 'превышен объём запроса: уменьшите число объектов в теле',
    422: 'противоречивые параметры: данные запроса не согласованы между собой',
    429: 'превышен лимит запросов: повторите позже',
};
export function reasonFor(status) {
    const known = STATUS_REASONS[status];
    if (known !== undefined)
        return known;
    if (status >= 500)
        return 'внутренняя ошибка сервиса: повторите позже';
    return 'неизвестный код ответа';
}
export class ApiError extends Error {
    constructor(init) {
        const parts = [`API ${init.status}: ${init.reason ?? reasonFor(init.status)}`];
        if (init.detail)
            parts.push(redact(init.detail));
        if (init.hint)
            parts.push(redact(init.hint));
        super(redact(parts.join(' — ')));
        this.name = 'ApiError';
        this.status = init.status;
        this.code = init.code ? redact(init.code).slice(0, MAX_TEXT) : null;
        this.detail = init.detail ? redact(init.detail).slice(0, MAX_TEXT) : null;
        this.hint = init.hint ? redact(init.hint).slice(0, MAX_TEXT) : null;
        this.retryAfterSeconds = init.retryAfterSeconds ?? null;
        this.body = init.body;
    }
    /** Повтор имеет смысл: лимит или временная недоступность сервиса. */
    get retryable() {
        return this.status === 429 || this.status >= 500;
    }
}
const asRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value
    : undefined;
const asText = (value) => typeof value === 'string' && value.trim() ? value.trim() : undefined;
/** Предел плоского текста, который становится причиной ошибки. */
const PLAIN_TEXT_MAX = 200;
/** Тело ответа → JSON. Пустое тело — не ошибка парсинга: часть методов успешна без тела. */
export function parseBody(text) {
    if (text === null || text === undefined)
        return undefined;
    const trimmed = typeof text === 'string' ? text.trim() : '';
    if (!trimmed)
        return undefined;
    try {
        return JSON.parse(trimmed);
    }
    catch {
        return trimmed;
    }
}
/** Поля, из которых вендоры кладут причину: берём первое непустое. */
const MESSAGE_KEYS = ['errorText', 'message', 'detail', 'details', 'title', 'error'];
/**
 * Тело + статус → `ApiError`. Вытаскивает причину из общего набора ключей;
 * вендорские конверты (когда важно различать формы) разбирает клиент.
 */
export function toApiError(status, body, options = {}) {
    const base = { status, retryAfterSeconds: options.retryAfterSeconds, body };
    const record = asRecord(body);
    if (record) {
        const found = MESSAGE_KEYS.map((key) => asText(record[key])).filter((text) => text !== undefined);
        const code = asText(record['code']);
        return new ApiError({ ...base, code, detail: found[0] ?? null, hint: found[1] ?? null });
    }
    const text = asText(body);
    // HTML-страница прокси причиной не становится: она уезжает только в body.
    const usable = text !== undefined && text.length <= PLAIN_TEXT_MAX && !text.startsWith('<') ? text : null;
    return new ApiError({ ...base, detail: usable });
}
/**
 * Неуспешный HTTP-ответ → `ApiError`. Тело читается из клона: исходный
 * `Response` остаётся пригодным вызывающему.
 */
export async function errorFromResponse(response) {
    const text = await response.clone().text().catch(() => '');
    return toApiError(response.status, parseBody(text), { retryAfterSeconds: retryAfterOf(response) });
}
/** `Retry-After` в секундах: числом или HTTP-датой (RFC 7231 разрешает оба вида). */
function retryAfterOf(response) {
    const header = response.headers.get('retry-after');
    if (header === null || header.trim() === '')
        return undefined;
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0)
        return seconds;
    const date = Date.parse(header);
    if (!Number.isFinite(date))
        return undefined;
    return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}
