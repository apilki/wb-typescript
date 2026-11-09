@apilki/wb — клиент Wildberries API (TypeScript).

Собран генератором из вендорских OpenAPI-спек. Каждый раздел API — своё
пространство имён: `import * as wb from '...'` даёт `wb.items`, `wb.ordersFbs`, …

## Установка

```sh
npm install @apilki/wb
```

## Использование

```ts
import { general, core } from '@apilki/wb';

const { config } = core.configure(general.Configuration, { token: process.env.WB_TOKEN });
const api = new general.ProverkaPodklyucheniyaKWbApiApi(config);
const { Status } = await api.getPing();
```

`core` — рукописное ядро в пакете: разбор токена (тип, категории, read-only)
до сетевого вызова, лимитер по заголовкам `X-Ratelimit-*` (с одним повтором
после 429), разбор двух конвертов ошибок вендора (`core.toWbError`) и песочница
(`{ sandbox: true }`, только для разделов с `*-sandbox`-двойником).

Токен: личный кабинет продавца Wildberries → «Настройки» → «Доступ к API».

Вендорская документация и OpenAPI-описания API принадлежат ООО «Вайлдберриз»
и в пакет не входят. Лицензия пакета — MIT (см. LICENSE).
