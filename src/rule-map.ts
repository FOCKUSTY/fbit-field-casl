import type { RawRuleMap, RuleEntry, RuleMapType } from "./types";
import { BitField, BitBuilder, BitFieldOperations, ZERO_BIT } from "fbit-field";

export class RuleMap<
  const Context,
> implements RuleMapType<Context> {
  public static create<const Context>(
    rules: RuleEntry<Context>[],
    offset: RuleMapType<Context>["offset"] = ZERO_BIT 
  ) {
    return new RuleMap<Context>(offset).execute(rules);
  }

  public readonly offset: bigint;

  private _map: RawRuleMap<Context> = new Map();
  
  public constructor(
    offset: RuleMapType<Context>["offset"] = ZERO_BIT
  ) {
    this.offset = this.resolveOffset(offset);
  }

  public get map(): RawRuleMap<Context> {
    return this._map;
  }

  public execute(rules: RuleEntry<Context>[]): RawRuleMap<Context> {
    return this.generateFromArray(rules);
  }

  private generateFromArray(rules: RuleEntry<Context>[]): RawRuleMap<Context> {
    const keys = rules.map((rule, index) => {
      return rule.id || `rule_${index}`;
    });

    const builder = new BitBuilder(keys);
    const bits = builder.execute({ offset: this.offset });
    const map: RawRuleMap<Context> = new Map();
    rules.forEach((rule, index) => {
      const key = keys[index];
      const bit = bits[key];
      map.set(bit, rule);
    });

    return map;
  }

  private resolveOffset(offset: RuleMapType<Context>["offset"]): bigint {
    if (offset instanceof BitField) {
      return BitFieldOperations.toBigInt(offset);
    }

    if (
      typeof offset === "bigint" ||
      typeof offset === "string" || 
      typeof offset === "number" ||
      typeof offset === "boolean"
    ) {
      return BitFieldOperations.toBigInt(offset);
    }

    if (offset instanceof Map) {
      return BitFieldOperations.summarize(...offset.keys());
    }

    return BitFieldOperations.summarize(
      ...offset.map.keys(),
      this.resolveOffset(offset.offset)
    );
  }
}
