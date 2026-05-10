import type { RuleEntry } from "../src/types";

export const sampleMap = new Map<bigint, RuleEntry>([
  [1n, { id: "read:article", action: "read", subject: "Article" }],
  [
    2n,
    {
      id: "update:own",
      action: "update",
      subject: "Article",
      conditions: (ctx) => ({ authorId: ctx.userId }),
    },
  ],
  [
    4n,
    {
      id: "delete:article",
      action: "delete",
      subject: "Article",
      isInverted: true,
    },
  ],
]);

export const emptyMap = new Map<bigint, RuleEntry>();
