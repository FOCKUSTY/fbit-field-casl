import assert from "assert";
import { createMongoAbility } from "@casl/ability";

import { createAbilityFromBits } from "../src/create-ability-from-bits";
import { abilityToBits } from "../src/ability-to-bits";
import { sampleMap } from "./fixtures";

describe("abilityToBits", () => {
  it("returns 0n for empty ability", () => {
    const ability = createMongoAbility();
    const bits = abilityToBits(ability, sampleMap);
    assert.strictEqual(bits, 0n);
  });

  it("recovers bits for rules with id", () => {
    const ability = createAbilityFromBits(1n | 2n, sampleMap);
    const bits = abilityToBits(ability, sampleMap);
    assert.strictEqual(bits, 1n | 2n);
  });

  it("recovers rule with function conditions using id", () => {
    const ability = createAbilityFromBits(2n, sampleMap, {
      context: { userId: 99 },
    });
    const bits = abilityToBits(ability, sampleMap);
    assert.strictEqual(bits, 2n);
  });

  it("does not recover inverted rule without id (reserve method ignores inverted)", () => {
    // Правило delete инвертировано и имеет id, поэтому должно восстановиться
    const ability = createAbilityFromBits(4n, sampleMap);
    const bits = abilityToBits(ability, sampleMap);
    // Поскольку id есть, оно восстановится
    assert.strictEqual(bits, 4n);
  });

  it("fails to recover inverted rule if id is missing", () => {
    const mapWithoutId = new Map(sampleMap);
    mapWithoutId.set(4n, {
      action: "delete",
      subject: "Article",
      isInverted: true,
    });
    const ability = createAbilityFromBits(4n, mapWithoutId);
    const bits = abilityToBits(ability, mapWithoutId);
    // Без id инвертированные правила не восстанавливаются
    assert.strictEqual(bits, 0n);
  });

  it("handles ambiguous mapping with isStrict: true", () => {
    const dupMap = new Map(sampleMap);
    dupMap.set(8n, {
      action: "delete",
      subject: "Article",
      isInverted: true,
      id: "delete:article",
    });
    // Два правила с одинаковым id → неоднозначность
    const ability = createAbilityFromBits(4n, dupMap);
    assert.throws(
      () => abilityToBits(ability, dupMap, { isStrict: true }),
      /Ambiguous rule mapping/,
    );
  });

  it("defaults to smallest bit for ambiguous mapping", () => {
    const dupMap = new Map(sampleMap);
    dupMap.set(8n, {
      action: "delete",
      subject: "Article",
      isInverted: true,
      id: "delete:article",
    });
    const ability = createAbilityFromBits(4n | 8n, dupMap);
    const bits = abilityToBits(ability, dupMap);
    // Должен выбрать 4n
    assert.strictEqual(bits, 4n);
  });

  it("ignores rules not found in map", () => {
    const ability = createMongoAbility();
    (ability as any).update([{ action: "manage", subject: "all" }]);
    const bits = abilityToBits(ability, sampleMap);
    assert.strictEqual(bits, 0n);
  });
});
