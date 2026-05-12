import type { BitFieldInput } from "fbit-field";
import type { RawRule } from "@casl/ability";
import type {
  AbilityOptions,
  RuleConditions,
  RuleEntry,
  RuleMap,
  WithSubjectType,
  Ability
} from "./types";

import { createMongoAbility } from "@casl/ability";
import {
  defaultBitsSort,
  extractBigInt,
  isBitValid,
  resolveRuleConditions
} from "./utils";
import { ZERO_BIT } from "fbit-field";

export class AbilityCreator<
  const Context,
  const Conditions extends RuleConditions<Context>
> {
  public constructor(
    public readonly bits: BitFieldInput,
    public readonly ruleMap: RuleMap<Context, Conditions>
  ) {}

  public execute(
    options: AbilityOptions = {},
    bitsInput?: BitFieldInput
  ): Ability {
    const abilityFactory = options.abilityFactory ?? createMongoAbility;
    const ability = abilityFactory();

    const bits = extractBigInt(bitsInput || this.bits);
    if (bits === ZERO_BIT) {
      return ability;
    }

    const keys = this.sortMapKeys(options.sortBits);
    const rules = this.generateRules({ keys, bits, options });
    if (rules.length > 0) {
      ability.update(rules);
    }

    return ability;
  }

  private sortMapKeys(sort?: AbilityOptions["sortBits"]): bigint[] {
    const sortKeys = sort ?? defaultBitsSort;
    const keys = [...this.ruleMap.keys()].sort(sortKeys);

    return keys;
  }

  private generateRules({
    keys,
    options,
    bits
  }: {
    keys: bigint[];
    bits: bigint;
    options: AbilityOptions;
  }): WithSubjectType<RawRule<any, any>>[] {
    const rules: WithSubjectType<RawRule<any, any>>[] = [];

    for (const bit of keys) {
      if (!isBitValid({ bit, bits })) {
        continue;
      }

      const rule = this.ruleMap.get(bit);
      if (!rule) {
        continue;
      }

      const rawRule: RawRule = this.createRawRule(rule, options.context);
      rules.push(rawRule);
    }

    return rules;
  }

  private createRawRule(
    rule: RuleEntry<Context, Conditions>,
    context?: AbilityOptions["context"]
  ): RawRule {
    const conditions = (() => {
      if (!rule.conditions) {
        return { __ruleId: rule.id };
      }

      const resolvedConditions = resolveRuleConditions({
        rule,
        context
      });

      const ruleIdObject = rule.id ? { __ruleId: rule.id } : {};
      return {
        ...resolvedConditions,
        ...ruleIdObject
      };
    })();

    const rawRule: RawRule = {
      ...rule,
      conditions
    };

    return rawRule;
  }
}
