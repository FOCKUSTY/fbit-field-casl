import type { BitField } from "fbit-field";
import { RuleEntry } from "./types";

/**
 * Извлекает значение bigint из переданных данных.
 * Если передан экземпляр BitField, возвращает его поле `bit`.
 */
export const extractBigInt = (bits: bigint | BitField): bigint => {
  if (typeof bits === "bigint") {
    return bits;
  }

  return bits.bit;
};

/**
 * Сортировка битов по возрастанию (по умолчанию).
 */
export const defaultBitSort = (a: bigint, b: bigint): number => {
  if (a < b) return -1;
  if (a > b) return 1;

  return 0;
};

export const resolveConditions = ({
  rule,
  context,
}: {
  rule: RuleEntry;
  context: any;
}) => {
  if (typeof rule.conditions === "function") {
    return rule.conditions(context ?? {});
  }

  return rule.conditions;
};

export const isBitsValided = ({
  bit,
  rawValue,
}: {
  rawValue: bigint;
  bit: bigint;
}) => {
  if (!(rawValue & bit)) {
    return false;
  }

  return true;
};

export const getMapRuleEntryAndValidateBits = ({
  bit,
  rawValue,
  map,
}: {
  rawValue: bigint;
  bit: bigint;
  map: Map<bigint, RuleEntry>;
}) => {
  if (!isBitsValided({ bit, rawValue })) {
    return null;
  }

  const entry = map.get(bit);
  if (!entry) {
    return null;
  }

  return entry;
};
