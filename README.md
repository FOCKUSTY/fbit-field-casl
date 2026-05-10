# @fbit-field/casl

Интеграция [`fbit-field`](https://github.com/FOCKUSTY/bit-field) и [CASL](https://casl.js.org/) для компактного хранения и высокопроизводительной сериализации прав доступа в виде `bigint`.

## Возможности

- 🚀 **Компактность** – одно число `bigint` заменяет десятки правил CASL.
- 🔁 **Двусторонняя конвертация** – биты ↔ Ability (включая поддержку динамических условий).
- 🔍 **Прозрачная отладка** – функция `bitsToRulesList` показывает, какие правила соответствуют битам.
- 📦 **Готовая типизация** – TypeScript‑first, строгие типы.
- 🧩 **Совместимость** – работает с любым `Ability`, построенным через `createMongoAbility` (или кастомную фабрику).

## Установка

```bash
npm install @casl/ability fbit-field @fbit-field/casl
```

## Быстрый старт

### 1. Создайте карту «бит → правило»

Каждый бит сопоставлен с действием (`action`), субъектом (`subject`), опциональными условиями, полями и флагом инвертирования (`isInverted`).

```ts
const ruleMap = new Map<bigint, RuleEntry>([
  [1n, { id: 'read:article',  action: 'read',   subject: 'Article' }],
  [2n, { id: 'create:article', action: 'create', subject: 'Article' }],
  [4n, { id: 'update:own',    action: 'update',  subject: 'Article', 
          conditions: (ctx) => ({ authorId: ctx.userId }) }],
  [8n, { id: 'delete:any',    action: 'delete',  subject: 'Article', isInverted: true }]
]);
```

### 2. Преобразуйте битовое поле в Ability

```ts
import { createAbilityFromBits } from '@fbit-field/casl';

const userBits = 1n | 4n; // read + update:own
const ability = createAbilityFromBits(userBits, ruleMap, {
  context: { userId: 42 }
});

// Проверка прав
ability.can('read', 'Article');                           // true
ability.can('update', 'Article', { authorId: 42 });      // true
ability.can('update', 'Article', { authorId: 99 });      // false
ability.can('delete', 'Article');                        // false (бит не установлен)
```

### 3. Обратная конвертация (Ability → биты)

```ts
import { abilityToBits } from '@fbit-field/casl';

const recoveredBits = abilityToBits(ability, ruleMap);
// recoveredBits === 5n (1n | 4n)
```

### 4. Отладочный вывод правил

```ts
import { bitsToRulesList } from '@fbit-field/casl';

const readable = bitsToRulesList(userBits, ruleMap, { userId: 42 });
// [{ action: 'read', subject: 'Article', ... }, { action: 'update', ... }]
```

## Интеграция с JWT

Храните права пользователя как `bigint` внутри токена.

```ts
// Создание токена
const tokenPayload = {
  userId: 42,
  permissions: userBits.toString()  // bigint → строка (JSON-совместимо)
};

// Восстановление на сервере
const bitsFromToken = BigInt(tokenPayload.permissions);
const userAbility = createAbilityFromBits(bitsFromToken, ruleMap, {
  context: { userId: tokenPayload.userId }
});
```

## API

### `createAbilityFromBits(bits, map, options?)`

Создаёт ability из битового поля (`bigint` или `BitField`).

| Параметр | Тип | Описание |
|----------|-----|----------|
| `bits` | `bigint \| BitField` | Входное битовое поле |
| `map` | `Map<bigint, RuleEntry>` | Соответствие битов правилам |
| `options.abilityFactory` | `() => AnyAbility` | Фабрика для создания ability (по умолчанию `createMongoAbility`) |
| `options.context` | `Record<string, any>` | Контекст для динамических условий-функций |
| `options.sortBits` | `(a: bigint, b: bigint) => number` | Функция сортировки битов |

### `abilityToBits(ability, map, options?)`

Восстанавливает `bigint` из ability.

| Параметр | Тип | Описание |
|----------|-----|----------|
| `ability` | `AnyAbility` | Исходный ability |
| `map` | `Map<bigint, RuleEntry>` | Та же карта, что использовалась при создании |
| `options.isStrict` | `boolean` | Если `true`, при неоднозначности выбрасывается ошибка |

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

## Лицензия

MIT © FOCKUSTY