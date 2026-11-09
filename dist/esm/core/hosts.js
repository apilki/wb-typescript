/**
 * Карта «сервис → хост» и режим песочницы.
 *
 * Источник истины — таблица `/ping` в доке вендора (снято 2026-11-05) и файл
 * `generator/configs/host-map.json`. Здесь тот же список в виде константы, потому
 * что ядро не читает файлы генератора; расхождение ловит тест
 * `hosts.test.ts` (сверяет с JSON).
 *
 * Зачем карта в рантайме: базовый адрес в спеке есть только у одного модуля из
 * двенадцати, а песочница — это подмена хоста, а не отдельный клиент.
 */
/** Боевые хосты из таблицы /ping. */
export const KNOWN_HOSTS = [
    'common-api.wildberries.ru',
    'content-api.wildberries.ru',
    'seller-analytics-api.wildberries.ru',
    'discounts-prices-api.wildberries.ru',
    'marketplace-api.wildberries.ru',
    'statistics-api.wildberries.ru',
    'advert-api.wildberries.ru',
    'feedbacks-api.wildberries.ru',
    'buyer-chat-api.wildberries.ru',
    'supplies-api.wildberries.ru',
    'returns-api.wildberries.ru',
    'documents-api.wildberries.ru',
    'finance-api.wildberries.ru',
    'user-management-api.wildberries.ru',
    // хосты, которые встречаются в спеке «Продвижения» и раздаются наравне с остальными
    'cmp.wildberries.ru',
    'dp-calendar-api.wildberries.ru',
    'advert-media-api.wildberries.ru',
];
/** Хосты, у которых есть песочничный двойник. */
export const SANDBOX_HOSTS = {
    'content-api.wildberries.ru': 'content-api-sandbox.wildberries.ru',
    'discounts-prices-api.wildberries.ru': 'discounts-prices-api-sandbox.wildberries.ru',
    'marketplace-api.wildberries.ru': 'marketplace-api-sandbox.wildberries.ru',
    'feedbacks-api.wildberries.ru': 'feedbacks-api-sandbox.wildberries.ru',
};
export class SandboxError extends Error {
    constructor(host) {
        super(`у сервиса ${host} нет песочницы: с включённым sandbox запрос ушёл бы на боевой хост. ` +
            'Выключите песочницу для этого раздела или используйте тестовый токен на боевом контуре осознанно');
        this.name = 'SandboxError';
        this.host = host;
    }
}
const hostOf = (urlOrHost) => {
    const value = String(urlOrHost).trim();
    // принимаем и «хост», и «https://хост/путь»
    const withoutScheme = value.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
    return withoutScheme.split('/')[0] ?? '';
};
/** Хост с учётом песочницы. Отсутствие двойника — явная ошибка, а не тихий прод. */
export function resolveHost(host, options = {}) {
    const clean = hostOf(host);
    if (!options.sandbox)
        return clean;
    const twin = SANDBOX_HOSTS[clean];
    if (!twin)
        throw new SandboxError(clean);
    return twin;
}
/** Полный базовый адрес: `https://<host>` (или его песочничный двойник). */
export function baseUrl(host, options = {}) {
    return `https://${resolveHost(host, options)}`;
}
