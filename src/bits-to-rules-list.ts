import type { BitField } from "fbit-field";
import type { Rule, RuleEntry } from "./types";

import {
  extractBigInt,
  defaultBitSort,
  resolveConditions,
  getMapRuleEntryAndValidateBits,
} from "./utils";

/**
 * Возвращает «читаемое» представление прав, соответствующих установленным битам,
 * без создания Ability. Удобна для отладки.
 *
 * @param bits - Битовое поле
 * @param map - Карта битов в правила
 * @param context - Контекст для вычисления динамических условий (опционально)
 * @returns Массив объектов правил
 */
export const bitsToRulesList = (
  bits: bigint | BitField,
  map: Map<bigint, RuleEntry>,
  context?: any,
): Rule[] => {
  const rawValue = extractBigInt(bits);
  const sortedKeys = [...map.keys()].sort(defaultBitSort);

  const array: Rule[] = [];

  for (const bit of sortedKeys) {
    const entry = getMapRuleEntryAndValidateBits({ map, bit, rawValue });
    if (!entry) {
      continue;
    }

    const resolvedConditions = resolveConditions({ rule: entry, context });

    array.push({
      action: entry.action,
      subject: entry.subject,
      conditions: resolvedConditions,
      isInverted: entry.isInverted ?? false,
      id: entry.id,
    });
  }

  return array;
};

export default bitsToRulesList;
