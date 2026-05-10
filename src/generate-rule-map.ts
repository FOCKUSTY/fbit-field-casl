import type { RuleEntry } from "./types";
import { BitBuilder, ZERO_BIT } from "fbit-field";

export interface GenerateRuleMapOptions {
  /**
   * Начальное смещение (bigint или существующая карта, чьи биты будут учтены).
   * Позволяет добавлять правила к уже существующей RuleMap.
   */
  offset?: bigint | Map<bigint, RuleEntry>;
  /**
   * Массив идентификаторов, используемых для генерации битов.
   * По умолчанию берутся `id` из правил (если есть) или `action:subject`.
   */
  keys?: string[];
}

export const generateRuleMap = (
  rules: RuleEntry[],
  options: GenerateRuleMapOptions = {},
): Map<bigint, RuleEntry> => {
  const keys =
    options.keys ?? rules.map((rule, index) => rule.id ?? `rule_${index}`);

  const offset = (() => {
    if (typeof options.offset === "bigint") {
      return options.offset;
    }

    if (!options.offset) {
      return ZERO_BIT;
    }

    const existingBits: Record<string, bigint> = {};
    for (const [bit, entry] of options.offset) {
      existingBits[entry.id ?? bit.toString()] = bit;
    }

    return existingBits;
  })();

  const builder = new BitBuilder(keys);
  const bitsMap = builder.execute({ offset });

  const ruleMap = new Map<bigint, RuleEntry>();
  rules.forEach((rule, index) => {
    const key = keys[index];
    const bit = bitsMap[key];

    ruleMap.set(bit, rule);
  });

  return ruleMap;
};

export const mergeRuleMaps = (
  base: Map<bigint, RuleEntry>,
  addition: Map<bigint, RuleEntry>,
) => {
  new Map([...base, ...addition]);
};
