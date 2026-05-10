# @fbit-field/casl

Интеграция [`fbit-field`](https://github.com/FOCKUSTY/bit-field) и [CASL](https://casl.js.org/) для компактного хранения и высокопроизводительной сериализации прав доступа в виде `bigint`.

## Возможности

- 🚀 **Компактность** – одно число `bigint` заменяет десятки правил CASL.
- 🔁 **Двусторонняя конвертация** – биты ↔ Ability (включая поддержку динамических условий).
- 🔍 **Прозрачная отладка** – функция `bitsToRulesList` показывает, какие правила соответствуют битам.
- 🧬 **Автоматическая генерация карты** – `generateRuleMap` превращает массив правил в `Map<bigint, RuleEntry>`, не требуя высчитывать смещения вручную.
- 📦 **Готовая типизация** – TypeScript‑first, строгие типы.
- 🧩 **Совместимость** – работает с любым `Ability`, построенным через `createMongoAbility` (или кастомную фабрику).

## Установка

```bash
npm install @casl/ability fbit-field @fbit-field/casl
```

## Быстрый старт

### 1. Создайте карту «бит → правило» автоматически

Перечислите правила в массиве – библиотека сама назначит биты последовательно (1‑е правило → `1n`, 2‑е → `2n`, 3‑е → `4n` и т.д.).  
Идентификаторы `id` обязательны для корректной обратной конвертации.

```ts
import { generateRuleMap } from "@fbit-field/casl";

const ruleMap = generateRuleMap([
  { id: "read:article", action: "read", subject: "Article" },
  { id: "create:article", action: "create", subject: "Article" },
  {
    id: "update:own",
    action: "update",
    subject: "Article",
    conditions: (context) => ({ authorId: context.userId }),
  },
  { id: "delete:any", action: "delete", subject: "Article", isInverted: true },
]);
```

Если нужно добавить правила к уже существующей карте, передайте её в `offset`:

```ts
const additionalMap = generateRuleMap(
  [{ id: "manage:settings", action: "manage", subject: "Settings" }],
  { offset: ruleMap },
); // новые биты начнутся после старых
```

### 2. Преобразуйте битовое поле в Ability

```ts
import { createAbilityFromBits } from "@fbit-field/casl";

const userBits = 1n | 4n; // read + update:own
const ability = createAbilityFromBits(userBits, ruleMap, {
  context: { userId: 42 },
});

// Проверка прав
ability.can("read", "Article"); // true
ability.can("update", "Article", { authorId: 42 }); // true
ability.can("update", "Article", { authorId: 99 }); // false
ability.can("delete", "Article"); // false (бит не установлен)
```

### 3. Обратная конвертация (Ability → биты)

```ts
import { abilityToBits } from "@fbit-field/casl";

const recoveredBits = abilityToBits(ability, ruleMap);
// recoveredBits === 5n (1n | 4n)
```

### 4. Отладочный вывод правил

```ts
import { bitsToRulesList } from "@fbit-field/casl";

const readable = bitsToRulesList(userBits, ruleMap, { userId: 42 });
// [{ action: 'read', subject: 'Article', ... }, { action: 'update', ... }]
```

## Интеграция с JWT

Храните права пользователя как `bigint` внутри токена.

```ts
// Создание токена
const tokenPayload = {
  userId: 42,
  permissions: userBits.toString(), // bigint → строка (JSON-совместимо)
};

// Восстановление на сервере
const bitsFromToken = BigInt(tokenPayload.permissions);
const userAbility = createAbilityFromBits(bitsFromToken, ruleMap, {
  context: { userId: tokenPayload.userId },
});
```

## API

### `generateRuleMap(rules, options?)`

Генерирует карту «бит → правило» из массива правил, автоматически распределяя биты с помощью `BitBuilder`.

| Параметр         | Тип                                | Описание                                                                                          |
| ---------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| `rules`          | `RuleEntry[]`                      | Массив правил                                                                                     |
| `options.offset` | `bigint \| Map<bigint, RuleEntry>` | Начальное смещение: число или существующая карта (позволяет добавлять правила к уже существующей) |
| `options.keys`   | `string[]`                         | Массив идентификаторов для генерации битов (по умолчанию берутся `id` правил)                     |

### `createAbilityFromBits(bits, map, options?)`

Создаёт ability из битового поля (`bigint` или `BitField`).

| Параметр                 | Тип                                | Описание                                                         |
| ------------------------ | ---------------------------------- | ---------------------------------------------------------------- |
| `bits`                   | `bigint \| BitField`               | Входное битовое поле                                             |
| `map`                    | `Map<bigint, RuleEntry>`           | Соответствие битов правилам                                      |
| `options.abilityFactory` | `() => AnyAbility`                 | Фабрика для создания ability (по умолчанию `createMongoAbility`) |
| `options.context`        | `Record<string, any>`              | Контекст для динамических условий-функций                        |
| `options.sortBits`       | `(a: bigint, b: bigint) => number` | Функция сортировки битов                                         |

### `abilityToBits(ability, map, options?)`

Восстанавливает `bigint` из ability.

| Параметр           | Тип                      | Описание                                              |
| ------------------ | ------------------------ | ----------------------------------------------------- |
| `ability`          | `AnyAbility`             | Исходный ability                                      |
| `map`              | `Map<bigint, RuleEntry>` | Та же карта, что использовалась при создании          |
| `options.isStrict` | `boolean`                | Если `true`, при неоднозначности выбрасывается ошибка |

> **Важно:** для инвертированных правил и правил с динамическими условиями всегда задавайте `id` в `RuleEntry` – иначе обратная конвертация не гарантируется.

### `bitsToRulesList(bits, map, context?)`

Возвращает массив «читаемых» правил для заданных битов (без создания ability).

## Типы

```ts
export interface RuleEntry {
  action: string;
  subject: string;
  id?: string;
  conditions?: Record<string, any> | ((context: any) => Record<string, any>);
  fields?: string[];
  isInverted?: boolean;
}
```

## Юридические условия

Проект распространяется под лицензией **MIT** (см. файл [LICENSE](./LICENSE)).  

**Для контрибьюторов:**  
Любой код, отправленный в этот проект, дополнительно регулируется **Contributor License Agreement (CLA)** ([CLA.md](./CLA.md)).  
CLA предоставляет автору проекта дополнительные права (в частности, право сублицензирования и смены лицензии), которые не ограничены MIT.  
Отправляя Pull Request, вы обязуетесь подписать CLA через бота CLAassistant.

**Для пользователей (потребителей библиотеки):**  
Вы получаете код под лицензией MIT. Условия CLA на вас не распространяются.
