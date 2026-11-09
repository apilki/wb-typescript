/**
 * Авторизация WB: токен в заголовке (`HeaderApiKey`) и локальный разбор JWT.
 *
 * Зачем разбирать токен локально, если сервер всё равно ответит 403:
 * - 403 у WB означает сразу пять разных причин (категория не та, метод не
 *   разрешён типу токена, пользователь удалён, метод заблокирован, нет подписки);
 * - разбор payload даёт точный ответ ДО сетевого вызова: «нужен токен с
 *   категорией Маркетплейс», «токен только на чтение», «токен истёк».
 *
 * Подпись не проверяется: секрета у клиента нет и быть не должно. Это
 * подсказка для разработчика, а не контроль доступа — решение принимает сервер.
 */
export type TokenType = 'base' | 'test' | 'personal' | 'service';
/** Категории доступа. Значение — номер бита в поле `s` (таблица из доки вендора). */
export declare const CATEGORY_BITS: {
    readonly content: 1;
    readonly analytics: 2;
    readonly prices: 3;
    readonly marketplace: 4;
    readonly statistics: 5;
    readonly promotion: 6;
    readonly questions: 7;
    readonly chat: 9;
    readonly supplies: 10;
    readonly returns: 11;
    readonly documents: 12;
    readonly finance: 13;
    readonly users: 16;
};
export type Category = keyof typeof CATEGORY_BITS;
export declare const CATEGORY_LABELS: Record<Category, string>;
/** Бит «токен только на чтение». */
export declare const READONLY_BIT = 30;
export declare class TokenError extends Error {
    readonly code: 'empty' | 'malformed' | 'expired' | 'category' | 'readonly' | 'writable-only';
    constructor(code: TokenError['code'], message: string);
}
export interface DecodedToken {
    type: TokenType;
    /** Тестовый токен: работает только с песочницей. */
    isTest: boolean;
    /** `self` для персонального, `asid:<id>` для сервисного, null если поля нет. */
    subject: string | null;
    /** Токен только на чтение (бит 30). */
    readOnly: boolean;
    /** Категории, которые реально выданы. */
    categories: Category[];
    /** Сырая маска — на случай, если вендор добавит биты раньше нас. */
    mask: number;
    expiresAt: Date | null;
    expired: boolean;
    tokenId: string | null;
    sellerId: string | null;
}
/**
 * Разбирает JWT без проверки подписи. Никогда не кладёт сам токен в текст ошибки:
 * исключения уезжают в логи и в отчёты, токен туда попадать не должен.
 *
 * shortcut: номера битов в `s` взяты из таблицы доки как есть; сверить с живым
 * токеном при первом прогоне с реальными кредами (тестового образца payload у нас нет).
 */
export declare function decodeToken(token: string): DecodedToken;
export interface TokenRequirement {
    /** Какая категория нужна операции. */
    category?: Category;
    /** Операция пишет данные — токен только на чтение не подойдёт. */
    write?: boolean;
}
/** Проверяет токен под требование операции и бросает понятную ошибку. */
export declare function assertToken(token: string, requirement?: TokenRequirement): DecodedToken;
