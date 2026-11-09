/**
 * HTTP-слой: единственная точка выхода в сеть для сгенерированных клиентов.
 *
 * Здесь живёт то, чего нет в сгенерированном коде: таймаут, отмена вызывающего,
 * ретраи по 429/5xx с уважением к `Retry-After` (и к `X-Ratelimit-Retry`/`Reset`
 * через лимитер) и пауза лимитера перед запросом.
 *
 * Слой НЕ бросает на HTTP-ошибку: он отдаёт `Response` как есть, а маппинг в
 * `ApiError` делает вызывающий. Причина: генераторы оборачивают всё, что
 * брошено из `fetchApi`, в свою ошибку — и наш класс перестал бы быть собой.
 */
export const DEFAULT_RETRY = { max: 3, baseDelayMs: 500, idempotentOnly: true };
export const DEFAULT_TIMEOUT_MS = 60000;
/** Статусы, которые имеет смысл повторить: троттлинг и временные сбои шлюза. */
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
/** Идемпотентные методы: только их повторяем вслепую. */
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS']);
/** Предел паузы из заголовка: больше минуты не ждём, лучше отдать ошибку. */
const MAX_WAIT_MS = 60000;
const sleepDefault = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const abortError = () => new DOMException('aborted', 'AbortError');
/** Таймаут отличается от отмены вызывающего: вызывающему важно, кто оборвал запрос. */
const timeoutError = (ms) => new DOMException(`Таймаут запроса (${ms} мс)`, 'TimeoutError');
/**
 * Пауза, которую можно прервать сигналом: иначе отмена вызывающего висела бы до
 * конца `Retry-After` (до минуты). Сама пауза не отменяется — таймер доживёт
 * вхолостую, но вызывающий уже получил отказ.
 */
function waitAbortable(ms, signal, sleep) {
    if (ms <= 0)
        return Promise.resolve();
    if (!signal)
        return sleep(ms);
    if (signal.aborted)
        return Promise.reject(abortError());
    return new Promise((resolve, reject) => {
        const onAbort = () => reject(abortError());
        signal.addEventListener('abort', onAbort, { once: true });
        sleep(ms).then(() => {
            signal.removeEventListener('abort', onAbort);
            resolve();
        }, (error) => {
            signal.removeEventListener('abort', onAbort);
            reject(error);
        });
    });
}
/** Хост из адреса запроса: без явного `host` все запросы не должны попадать в один бакет. */
function hostOf(input) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    try {
        return new URL(url).host;
    }
    catch {
        return '';
    }
}
/** Пауза из `Retry-After` (секунды или HTTP-дата): сервер сам говорит, когда вернуться. */
function retryAfterMs(response, now) {
    const header = response.headers.get('retry-after');
    if (header === null || header.trim() === '')
        return undefined;
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0)
        return Math.min(seconds * 1000, MAX_WAIT_MS);
    const date = Date.parse(header);
    if (Number.isFinite(date))
        return Math.max(0, Math.min(date - now(), MAX_WAIT_MS));
    return undefined;
}
function headersToRecord(headers) {
    const acc = {};
    headers.forEach((value, key) => {
        acc[key] = value;
    });
    return acc;
}
export function createHttpFetch(options) {
    const { fetch: doFetch, limiter } = options;
    const timeoutMs = typeof options.timeoutMs === 'number' && Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
        ? options.timeoutMs
        : DEFAULT_TIMEOUT_MS;
    const retry = {
        max: options.retry?.max ?? DEFAULT_RETRY.max,
        baseDelayMs: options.retry?.baseDelayMs ?? DEFAULT_RETRY.baseDelayMs,
        idempotentOnly: options.retry?.idempotentOnly ?? DEFAULT_RETRY.idempotentOnly,
    };
    const sleep = options.sleep ?? sleepDefault;
    const now = options.now ?? (() => Date.now());
    const fixedHost = options.host;
    const state = { retryAfterMs: undefined, retried: 0 };
    /** Одна попытка с таймаутом; сигнал вызывающего уважаем. */
    async function attempt(url, init) {
        const controller = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            controller.abort(timeoutError(timeoutMs));
        }, timeoutMs);
        const external = init.signal ?? undefined;
        // Причину отмены вызывающего пробрасываем как есть: он вправе её указать.
        const onAbort = () => controller.abort(external?.reason);
        if (external) {
            if (external.aborted)
                controller.abort(external.reason);
            else
                external.addEventListener('abort', onAbort, { once: true });
        }
        try {
            return await doFetch(url, { ...init, signal: controller.signal });
        }
        catch (error) {
            // Свой таймаут отдаём узнаваемо: он не ретраится и не путается с отменой.
            if (timedOut && !(init.signal?.aborted))
                throw timeoutError(timeoutMs);
            throw error;
        }
        finally {
            clearTimeout(timer);
            // Слушатель снимаем сами: { once } убирает его только ПОСЛЕ срабатывания,
            // а один и тот же signal переиспользуется между попытками.
            external?.removeEventListener('abort', onAbort);
        }
    }
    /** Тело-поток ко второй попытке уже прочитано — такие запросы не повторяем. */
    const replayable = (init) => init.body === undefined || init.body === null || typeof init.body === 'string';
    const fetchImpl = async (input, init = {}) => {
        const method = (init.method ?? 'GET').toUpperCase();
        const idempotent = !retry.idempotentOnly || IDEMPOTENT_METHODS.has(method);
        const host = fixedHost ?? hostOf(input);
        const signal = init.signal;
        let retries = 0;
        for (;;) {
            if (limiter) {
                const wait = Math.min(limiter.delayMs(host), MAX_WAIT_MS);
                if (wait > 0)
                    await waitAbortable(wait, signal, sleep);
            }
            let response;
            try {
                response = await attempt(input, init);
            }
            catch (error) {
                // Отмена вызывающего и таймаут — наверх: решение принимает вызывающий,
                // повтор долгого запроса только удлинит ожидание.
                if (signal?.aborted || error?.name === 'TimeoutError')
                    throw error;
                if (!(retries < retry.max) || !idempotent || !replayable(init))
                    throw error;
                retries += 1;
                state.retried = retries;
                await waitAbortable(retry.baseDelayMs * 2 ** (retries - 1), signal, sleep);
                continue;
            }
            if (limiter)
                limiter.noteResponse(response.status, headersToRecord(response.headers), host);
            // Пауза из заголовка важнее бэкоффа; без заголовка — остаток дедлайна лимитера.
            const fromHeader = retryAfterMs(response, now);
            const fromLimiter = limiter ? Math.min(limiter.delayMs(host), MAX_WAIT_MS) : 0;
            const after = fromHeader ?? (fromLimiter > 0 ? fromLimiter : undefined);
            if (after !== undefined)
                state.retryAfterMs = after;
            // 429 повторяем и для неидемпотентных: сервер прямо сказал «не обработал,
            // приходи позже», эффекта не было. 5xx и сетевые сбои — только там, где
            // повтор не создаёт второго эффекта.
            const retryable = response.status === 429 || (idempotent && RETRYABLE_STATUS.has(response.status));
            const canRetry = retries < retry.max && retryable && replayable(init);
            if (!canRetry)
                return response;
            retries += 1;
            state.retried = retries;
            const delay = after ?? retry.baseDelayMs * 2 ** (retries - 1);
            // Не ждём: у пустого тела отмена иногда не резолвится, а ждать её незачем.
            void response.body?.cancel().catch(() => undefined);
            await waitAbortable(delay, signal, sleep);
        }
    };
    return { fetch: fetchImpl, state };
}
