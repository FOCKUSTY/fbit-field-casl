import assert from "assert";
import { BitField } from "fbit-field";

import { bitsToRulesList } from "../src/bits-to-rules-list";
import { sampleMap } from "./fixtures";

describe("bitsToRulesList", () => {
  it("returns empty array for 0n", () => {
    const list = bitsToRulesList(0n, sampleMap);
    assert.deepStrictEqual(list, []);
  });

  it("lists readable rules for set bits", () => {
    const list = bitsToRulesList(1n | 4n, sampleMap);
    assert.strictEqual(list.length, 2);
    assert.strictEqual(list[0].action, "read");
    assert.strictEqual(list[1].isInverted, true);
  });

  it("resolves function conditions with context", () => {
    const list = bitsToRulesList(2n, sampleMap, { userId: 7 });
    assert.deepStrictEqual(list[0].conditions, { authorId: 7 });
  });

  it("handles BitField instance", () => {
    const bf = new BitField(2n);
    const list = bitsToRulesList(bf, sampleMap);
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].id, "update:own");
  });

  it("ignores bits not in map", () => {
    const list = bitsToRulesList(8n, sampleMap);
    assert.strictEqual(list.length, 0);
  });
});
