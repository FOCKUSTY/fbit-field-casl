import assert from "assert";
import { generateRuleMap } from "../src/generate-rule-map";

describe("generateRuleMap", () => {
  it("создаёт карту с последовательными битами", () => {
    const map = generateRuleMap([
      { id: "a", action: "read", subject: "X" },
      { id: "b", action: "write", subject: "X" },
    ]);
    assert.strictEqual(map.size, 2);
    assert.ok(map.has(1n));
    assert.ok(map.has(2n));
  });

  it("использует id как ключ для BitBuilder", () => {
    const map = generateRuleMap([
      { id: "read:article", action: "read", subject: "Article" },
    ]);
    assert.strictEqual(map.get(1n)?.action, "read");
  });

  it("принимает offset в виде bigint", () => {
    const map = generateRuleMap([{ id: "x", action: "a", subject: "S" }], {
      offset: 5n,
    });
    assert.ok(map.has(1n << 5n));
  });

  it("принимает offset в виде существующей Map", () => {
    const base = new Map([[4n, { id: "old", action: "old", subject: "S" }]]);
    const map = generateRuleMap([{ id: "new", action: "new", subject: "S" }], {
      offset: base,
    });
    // новый бит должен быть следующим после 4n, т.е. 8n
    assert.ok(map.has(8n));
  });
});
