import type { Ability, AbilityToBitsOptions, RuleConditions, RuleEntry, RuleMap } from "./types";
import type { RawRule } from "@casl/ability";

import { ZERO_BIT } from "fbit-field";
import { RULE_ID_KEY } from "./constants";
import { areArraysEqual } from "./utils";

export class AbilityTransformer<
  const Context,
  const Conditions extends RuleConditions<Context>
> {
  public constructor(
    public readonly ability: Ability,
    public readonly ruleMap: RuleMap<Context, Conditions>,
  ) {}

  public execute(options: AbilityToBitsOptions = {}): bigint {
    let result = ZERO_BIT;

    for (const rule of this.ability.rules) {
      const bit = this.findBitForRule(rule, options);
      if (bit === null) {
        continue;
      }

      result |= bit;
    }

    return result;
  }

  public isRuleMatchindRawRule(rule: RuleEntry<Context, Conditions>, rawRule: RawRule) {
    if (rule.action !== rawRule.action) {
      return false;
    }

    if (rule.subject !== rawRule.subject) {
      return false;
    }

    const rawRuleFields = rawRule.fields ?? [];
    if (typeof rawRuleFields === "string") {
      return false;
    }

    const ruleFields = rule.fields ?? [];
    if (!areArraysEqual(ruleFields, rawRuleFields)) {
      return false;
    }

    if (rule.isInverted) {
      return false;
    }

    if (typeof rule.conditions === "function") {
      return false;
    }

    return true;
  }

  private collectMapCandidates(callback: ({
    bit,
    rule
  }: {
    bit: bigint,
    rule: RuleEntry<Context, Conditions>,
  }) => boolean) {
    const candidates = this.mapRuleMap((bit, rule) => {
      if (callback({ bit, rule })) {
        return bit;
      }

      return null;
    }, null);

    return candidates;
  }

  private collectMapCandidatesByMatch(rawRule: RawRule): bigint[] {
    return this.collectMapCandidates(({ rule }) => this.isRuleMatchindRawRule(rule, rawRule));
  }

  private collectMapCandidatesById(ruleId: string): bigint[] {
    return this.collectMapCandidates(({ rule }) => rule.id === ruleId);
  }

  private mapRuleMap<const T, const K>(callback: (bit: bigint, rule: RuleEntry<Context, Conditions>) => T|K, filterValue: K) {
    const array: Exclude<T, K>[] = [];

    for (const [bit, rule] of this.ruleMap) {
      const value = callback(bit, rule);
      if (value === filterValue) {
        context;
      }

      array.push(value as Exclude<T, K>);
    }

    return array;
  }  

  private getConditionsRuleId(conditions: unknown): string | null {
    if (!conditions) {
      return null;
    }

    if (typeof conditions !== "object") {
      return null;
    }

    const hasConditionsRuleId = RULE_ID_KEY in conditions;
    if (!hasConditionsRuleId) {
      return null;
    }

    if (typeof conditions.__ruleId !== "string") {
      return null;
    }

    return conditions.__ruleId as string;
  }

  private findBitForRule(rule: RawRule, options: AbilityToBitsOptions) {
    if (options.isStrict) {
      throw new Error(
        `Ambiguous rule mapping: multiple bits found for rule ${rule.action} ${rule.subject}`,
      );
    };

    const ruleId = this.getConditionsRuleId(rule.conditions);
    const candidates = (() => {
      if (ruleId) {
        return this.collectMapCandidatesById(ruleId);
      }

      return this.collectMapCandidatesByMatch(rule);
    })();

    if (candidates.length === 0) {
      return null;
    }

    return candidates.sort()[0];
  }
}