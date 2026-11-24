# @apilki/wb — JavaScript/TypeScript client

**Version: 0.8.0 · API as of 2026-11-24**

A **curated generated TypeScript client** for the Wildberries Seller API — generated from the official API specification, then brought to production quality: full coverage, always fresh, zero dependencies.

```sh
npm install @apilki/wb
```

Source, releases and changelog: [github.com/apilki/wb-typescript](https://github.com/apilki/wb-typescript).

## Что это

Клиент для Seller API Wildberries: сгенерирован из официальной документации API и доведён до ума.

- **Полное покрытие** — все разделы API, каждый в своём пространстве имён.
- **Всегда свежий** — следит за официальной документацией, неоднозначности и конфликты описаний разбираются агентами и автоматическими рецептами.
- **Ноль зависимостей** — работает на стандартном `fetch`, ничего лишнего в дереве.
- **Типизация без сюрпризов** — строгие типы запросов и ответов, `undefined` вместо «магии».
- **Рукописное ядро** — разбор токена, лимитер по заголовкам вендора, единый разбор ошибок.

## Установка

```sh
npm install @apilki/wb
```

Пакет собирается в двух форматах: CommonJS (`dist/`) и ESM (`dist/esm/`).

## Быстрый старт

```ts
import { general, core } from '@apilki/wb';

const { config } = core.configure(general.Configuration, { token: process.env.WB_TOKEN });
const api = new general.ProverkaPodklyucheniyaKWbApiApi(config);

const { Status } = await api.getPing();
```

Токен: личный кабинет продавца Wildberries → «Настройки» → «Доступ к API».

Каждый раздел API — отдельное пространство имён: `import * as wb from '@apilki/wb'` даёт
`wb.items`, `wb.ordersFbs`, `wb.finances` и остальные — так автодополнение не тонет в тысяче имён.

## Ошибки

Вендор отвечает двумя разными конвертами ошибок. Ядро приводит их к одному виду:

```ts
import { core } from '@apilki/wb';

try {
  await api.getPing();
} catch (e) {
  console.error(core.toWbError(e)); // { code, message, details, requestId }
}
```

Разбор ошибки не требует сетевого вызова: тело ответа уже прочитано ядром.

## Лимиты и повторы

Ядро читает заголовки `X-Ratelimit-*` и держит лимитер на клиента: при `429`
делает один повтор после паузы из заголовка. Больше одного повтора нет намеренно —
бесконечные ретраи прячут проблему на стороне вызывающего кода.

Токен разбирается до сетевого вызова: тип токена (обычный / read-only / категорийный)
и его категории известны до первого запроса, поэтому неподходящий вызов падает сразу,
а не через таймаут.

## Песочница

Разделы, у которых есть песочный двойник, работают в тестовом контуре флагом:

```ts
const sandbox = new general.ProverkaPodklyucheniyaKWbApiApi(config, { sandbox: true });
```

## Особенности сборки

- **Имена методов** — как в официальном описании API (транслитерация вендора), без переименований:
  так поиск по документации совпадает с кодом.
- **Аргументы** — объектом, обязательные поля отдельного типа; необязательные — `Partial`.
- **Даты** — строки ISO, без подмены на `Date`: клиент не решает за вас про часовые пояса.
- **Полифилы** — не поставляются: модуль рассчитан на `fetch`, который есть в Node 18+ и любом
  современном браузере.
- **Совместимость** — TypeScript 5+, `"moduleResolution": "bundler"` или `"node16"`.

## Postman-коллекция

Готовая Postman Collection v2.1 (306 запросов — все операции спецификации, по модулям API) —
отдельный репозиторий [apilki/wb-postman](https://github.com/apilki/wb-postman)
(`postman/collection.json`). Заполните переменную коллекции `apiKey` — ваш токен WB API.
Обновляется пайплайном при каждой смене API.

## Лицензия

MIT (см. `LICENSE`). Официальная документация и описания API принадлежат правообладателю
и в пакет не входят — в пакете только клиентский код.
