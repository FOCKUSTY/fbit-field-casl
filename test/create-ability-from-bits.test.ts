import assert from "assert";

import { createMongoAbility } from "@casl/ability";
import { BitField } from "fbit-field";

import { createAbilityFromBits } from "../src/create-ability-from-bits";
import { sampleMap, emptyMap } from "./fixtures";

describe("createAbilityFromBits", () => {
  it("returns empty ability for 0n", () => {
    const ability = createAbilityFromBits(0n, sampleMap);
    assert.strictEqual(ability.rules.length, 0);
  });

  it("returns empty ability for empty map", () => {
    const ability = createAbilityFromBits(1n, emptyMap);
    assert.strictEqual(ability.rules.length, 0);
  });

  it("adds can rules for set bits", () => {
    const bits = 1n | 2n; // read и update
    const ability = createAbilityFromBits(bits, sampleMap);
    assert.strictEqual(ability.rules.length, 2);
    assert.ok(ability.can("read", "Article"));
    assert.ok(ability.can("update", "Article"));
  });

  it("applies inverted rules (cannot)", () => {
    const bits = 4n;
    const ability = createAbilityFromBits(bits, sampleMap);
    assert.strictEqual(ability.rules.length, 1);
    assert.ok(ability.cannot("delete", "Article"));
  });

  it("resolves function conditions with context", () => {
    const bits = 2n;
    const ability = createAbilityFromBits(bits, sampleMap, {
      context: { userId: 42 },
    });
    const rule = ability.rules[0];
    assert.deepStrictEqual(rule.conditions, {
      authorId: 42,
      __ruleId: "update:own",
    });
  });

  it("adds __ruleId even without explicit conditions", () => {
    const bits = 1n;
    const ability = createAbilityFromBits(bits, sampleMap);
    assert.deepStrictEqual(ability.rules[0].conditions, {
      __ruleId: "read:article",
    });
  });

  it("works with custom abilityFactory", () => {
    const customAbility = createAbilityFromBits(1n, sampleMap, {
      abilityFactory: () => createMongoAbility(),
    });
    assert.ok(customAbility.can("read", "Article"));
  });

  it("handles BitField instance", () => {
    const bf = new BitField(1n | 2n);
    const ability = createAbilityFromBits(bf, sampleMap);
    assert.strictEqual(ability.rules.length, 2);
  });

  it("ignores bits not present in map", () => {
    const bits = 8n; // нет в sampleMap
    const ability = createAbilityFromBits(bits, sampleMap);
    assert.strictEqual(ability.rules.length, 0);
  });
});
