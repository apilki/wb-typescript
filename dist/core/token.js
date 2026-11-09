"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenError = exports.READONLY_BIT = exports.CATEGORY_LABELS = exports.CATEGORY_BITS = void 0;
exports.decodeToken = decodeToken;
exports.assertToken = assertToken;
/** Категории доступа. Значение — номер бита в поле `s` (таблица из доки вендора). */
exports.CATEGORY_BITS = {
    content: 1,
    analytics: 2,
    prices: 3,
    marketplace: 4,
    statistics: 5,
    promotion: 6,
    questions: 7,
    chat: 9,
    supplies: 10,
    returns: 11,
    documents: 12,
    finance: 13,
    users: 16,
};
exports.CATEGORY_LABELS = {
    content: 'Контент',
    analytics: 'Аналитика',
    prices: 'Цены и скидки',
    marketplace: 'Маркетплейс',
    statistics: 'Статистика',
    promotion: 'Продвижение',
    questions: 'Вопросы и отзывы',
    chat: 'Чат с покупателями',
    supplies: 'Поставки',
    returns: 'Возвраты покупателями',
    documents: 'Документы',
    finance: 'Финансы',
    users: 'Пользователи',
};
/** Бит «токен только на чтение». */
exports.READONLY_BIT = 30;
const TOKEN_TYPES = { 1: 'base', 2: 'test', 3: 'personal', 4: 'service' };
class TokenError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'TokenError';
        this.code = code;
    }
}
exports.TokenError = TokenError;
function base64UrlToJson(part) {
    const pad = part.length % 4 === 0 ? '' : '='.repeat(4 - (part.length % 4));
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/') + pad;
    const bin = atob(b64);
    // atob отдаёт бинарную строку: UTF-8 восстанавливаем байтами, иначе кириллица
    // в payload превращается в мусор (в payload её быть не должно, но парсер не должен врать).
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const text = new TextDecoder('utf-8').decode(bytes);
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new TokenError('malformed', 'payload токена — не JSON-объект');
    }
    return parsed;
}
const hasBit = (mask, bit) => (mask & (1 << bit)) !== 0;
/**
 * Разбирает JWT без проверки подписи. Никогда не кладёт сам токен в текст ошибки:
 * исключения уезжают в логи и в отчёты, токен туда попадать не должен.
 *
 * shortcut: номера битов в `s` взяты из таблицы доки как есть; сверить с живым
 * токеном при первом прогоне с реальными кредами (тестового образца payload у нас нет).
 */
function decodeToken(token) {
    if (typeof token !== 'string' || !token.trim()) {
        throw new TokenError('empty', 'токен WB не передан: нужен HeaderApiKey');
    }
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
        throw new TokenError('malformed', 'токен WB не похож на JWT: ожидается три части через точку');
    }
    let payload;
    try {
        payload = base64UrlToJson(parts[1]);
    }
    catch (err) {
        if (err instanceof TokenError)
            throw err;
        throw new TokenError('malformed', 'payload токена WB не читается: не base64url-JSON');
    }
    const acc = Number(payload.acc);
    const type = TOKEN_TYPES[acc];
    if (!type) {
        throw new TokenError('malformed', `неизвестный тип токена WB: acc=${payload.acc}`);
    }
    const mask = typeof payload.s === 'number' ? payload.s : 0;
    const categories = Object.keys(exports.CATEGORY_BITS).filter((c) => hasBit(mask, exports.CATEGORY_BITS[c]));
    const exp = typeof payload.exp === 'number' ? payload.exp : null;
    const expiresAt = exp === null ? null : new Date(exp * 1000);
    return {
        type,
        isTest: payload.t === true || acc === 2,
        subject: typeof payload.for === 'string' ? payload.for : null,
        readOnly: hasBit(mask, exports.READONLY_BIT),
        categories,
        mask,
        expiresAt,
        expired: expiresAt !== null && expiresAt.getTime() <= Date.now(),
        tokenId: typeof payload.id === 'string' ? payload.id : null,
        sellerId: typeof payload.sid === 'string' ? payload.sid : null,
    };
}
const labelOf = (category) => exports.CATEGORY_LABELS[category] ?? category;
/** Проверяет токен под требование операции и бросает понятную ошибку. */
function assertToken(token, requirement = {}) {
    const decoded = decodeToken(token);
    if (decoded.expired) {
        throw new TokenError('expired', `токен WB истёк ${decoded.expiresAt?.toISOString()}: выпустите новый в кабинете продавца`);
    }
    if (requirement.category && !decoded.categories.includes(requirement.category)) {
        const have = decoded.categories.length
            ? decoded.categories.map(labelOf).join(', ')
            : 'ни одной категории';
        throw new TokenError('category', `нужен токен с категорией «${labelOf(requirement.category)}», а в токене: ${have}`);
    }
    if (requirement.write && decoded.readOnly) {
        throw new TokenError('readonly', 'токен WB выдан только на чтение: операция изменяет данные, нужен токен с правом записи');
    }
    return decoded;
}
