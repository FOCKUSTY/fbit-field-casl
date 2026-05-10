import type { RawRule } from "@casl/ability";
import type { RuleEntry, AbilityToBitsOptions, Ability } from "./types";

import { ZERO_BIT } from "fbit-field";

/**
 * Ищет в карте биты, чей id совпадает с переданным.
 */
export const collectCandidatesById = (
  ruleId: string,
  map: Map<bigint, RuleEntry>,
): bigint[] => {
  const candidates: bigint[] = [];

  for (const [bit, entry] of map) {
    if (entry.id === ruleId) {
      candidates.push(bit);
    }
  }

  return candidates;
};

/**
 * Проверяет, соответствует ли запись карты правилу CASL
 * (только для резервного метода, без учёта id).
 */
export const isEntryMatchingRule = (
  entry: RuleEntry,
  rule: RawRule,
): boolean => {
  if (entry.action !== rule.action) {
    return false;
  }

  if (entry.subject !== rule.subject) {
    return false;
  }

  const entryFields = entry.fields ?? [];
  const ruleFields = (rule as any).fields ?? [];

  if (!areArraysEqual(entryFields, ruleFields)) {
    return false;
  }

  if (entry.isInverted) {
    return false;
  }

  if (typeof entry.conditions === "function") {
    return false;
  }

  return true;
};

/**
 * Ищет в карте биты, соответствующие правилу по action, subject, fields.
 * Инвертированные правила и правила с функциями-условиями пропускаются.
 */
export const collectCandidatesByMatch = (
  rule: RawRule,
  map: Map<bigint, RuleEntry>,
): bigint[] => {
  const candidates: bigint[] = [];

  for (const [bit, entry] of map) {
    if (isEntryMatchingRule(entry, rule)) {
      candidates.push(bit);
    }
  }

  return candidates;
};

export const getConditionsRuleId = (conditions: unknown): string | null => {
  if (!conditions) {
    return null;
  }

  if (typeof conditions !== "object") {
    return null;
  }

  const hasConditionsRuleId = "__ruleId" in conditions;
  if (!hasConditionsRuleId) {
    return null;
  }

  if (typeof conditions.__ruleId !== "string") {
    return null;
  }

  return conditions.__ruleId as string;
};

/**
 * Ищет бит, соответствующий правилу CASL, в карте.
 * Приоритетный метод: по `__ruleId` в условиях.
 * Резервный метод: по action, subject и fields.
 */
export const findBitForRule = (
  rule: RawRule,
  map: Map<bigint, RuleEntry>,
  options: AbilityToBitsOptions,
): bigint | null => {
  if (options.isStrict) {
    throw new Error(
      `Ambiguous rule mapping: multiple bits found for rule ${rule.action} ${rule.subject}`,
    );
  }

  const ruleId = getConditionsRuleId(rule.conditions);
  const candidates = (() => {
    if (ruleId) {
      return collectCandidatesById(ruleId, map);
    }

    return collectCandidatesByMatch(rule, map);
  })();

  if (candidates.length === 0) {
    return null;
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  candidates.sort((a, b) => {
    if (a > b) return 1;
    if (a < b) return -1;

    return 0;
  });

  return candidates[0];
};

/** Сравнение двух массивов строк (игнорируя порядок). */
export const areArraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  return sortedA.every((val, idx) => val === sortedB[idx]);
};

/**
 * Преобразует правила CASL обратно в bigint на основе карты соответствия.
 *
 * @param ability - Экземпляр PureAbility
 * @param map - Карта бит → правило
 * @param options - Настройки (строгий режим и пр.)
 * @returns bigint, представляющий объединение битов найденных правил
 */
export const abilityToBits = (
  ability: Ability,
  map: Map<bigint, RuleEntry>,
  options: AbilityToBitsOptions = {},
): bigint => {
  let result = ZERO_BIT;

  for (const rule of ability.rules) {
    const bit = findBitForRule(rule, map, options);
    if (bit !== null) {
      result |= bit;
    }
  }

  return result;
};
