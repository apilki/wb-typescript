export declare const TOKEN_ENV = "WB_API_TOKEN";
export interface AuthConfig {
    token?: string;
    /** Подставить песочницу: тестовый токен работает только с `*-sandbox`. */
    sandbox?: boolean;
}
/** Токен из явного конфига, иначе из окружения. Пустое значение = токена нет. */
export declare function resolveToken(config?: AuthConfig, env?: Record<string, string | undefined>): string;
/** Заголовки авторизации для запроса. */
export declare function authHeaders(token: string): Record<string, string>;
/** Вырезание секретов — общее правило ядра, не вендорское. */
export { redact } from './shared/errors';
