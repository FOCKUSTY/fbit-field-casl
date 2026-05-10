import type {
  RuleEntry,
  CreateAbilityFromBitsOptions,
  Ability,
  WithSubjectType,
} from "./types";
import type { RawRule } from "@casl/ability";
import type { BitField } from "fbit-field";

import { createMongoAbility } from "@casl/ability";
import { ZERO_BIT } from "fbit-field";
import {
  extractBigInt,
  defaultBitSort,
  resolveConditions,
  getMapRuleEntryAndValidateBits,
} from "./utils";

export const createAbilityFromBits = (
  bits: bigint | BitField,
  map: Map<bigint, RuleEntry>,
  options: CreateAbilityFromBitsOptions = {},
): Ability => {
  const rules: WithSubjectType<RawRule<any, any>>[] = [];

  const abilityFactory = options.abilityFactory ?? createMongoAbility;
  const ability = abilityFactory();

  const rawValue = extractBigInt(bits);
  if (rawValue === ZERO_BIT) {
    return ability;
  }

  const sortBits = options.sortBits ?? defaultBitSort;
  const sortedKeys = [...map.keys()].sort(sortBits);
  for (const bit of sortedKeys) {
    const entry = getMapRuleEntryAndValidateBits({ map, bit, rawValue });
    if (!entry) {
      continue;
    }

    const rawRule: RawRule = {
      action: entry.action,
      subject: entry.subject,
    };

    rawRule.conditions = (() => {
      if (entry.conditions) {
        const resolvedConditions = resolveConditions({
          rule: entry,
          context: options.context,
        });

        const idObject = entry.id ? { __ruleId: entry.id } : {};

        return {
          ...resolvedConditions,
          ...idObject,
        };
      }

      return { __ruleId: entry.id };
    })();

    if (entry.fields) {
      rawRule.fields = entry.fields;
    }

    if (entry.isInverted) {
      rawRule.inverted = true;
    }

    rules.push(rawRule);
  }

  if (rules.length > 0) {
    ability.update(rules);
  }

  return ability;
};
