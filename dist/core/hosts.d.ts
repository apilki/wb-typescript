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
export declare const KNOWN_HOSTS: readonly ["common-api.wildberries.ru", "content-api.wildberries.ru", "seller-analytics-api.wildberries.ru", "discounts-prices-api.wildberries.ru", "marketplace-api.wildberries.ru", "statistics-api.wildberries.ru", "advert-api.wildberries.ru", "feedbacks-api.wildberries.ru", "buyer-chat-api.wildberries.ru", "supplies-api.wildberries.ru", "returns-api.wildberries.ru", "documents-api.wildberries.ru", "finance-api.wildberries.ru", "user-management-api.wildberries.ru", "cmp.wildberries.ru", "dp-calendar-api.wildberries.ru", "advert-media-api.wildberries.ru"];
/** Хосты, у которых есть песочничный двойник. */
export declare const SANDBOX_HOSTS: Record<string, string>;
export declare class SandboxError extends Error {
    readonly host: string;
    constructor(host: string);
}
export interface HostOptions {
    sandbox?: boolean;
}
/** Хост с учётом песочницы. Отсутствие двойника — явная ошибка, а не тихий прод. */
export declare function resolveHost(host: string, options?: HostOptions): string;
/** Полный базовый адрес: `https://<host>` (или его песочничный двойник). */
export declare function baseUrl(host: string, options?: HostOptions): string;
