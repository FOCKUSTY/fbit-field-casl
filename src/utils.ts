import { Bit, BitField, BitFieldOperations } from "fbit-field";
import type { RuleConditions, RuleEntry } from "./types";

/**
 * Извлекает значение bigint из переданных данных.
 * Если передан экземпляр BitField, возвращает его поле `bit`.
 */
export const extractBigInt = (bits: Bit | BitField): bigint => {
  return BitFieldOperations.toBigInt(bits);
};

/**
 * Сортировка битов по возрастанию (по умолчанию).
 */
export const defaultBitsSort = (a: bigint, b: bigint): number => {
  if (a < b) return -1;
  if (a > b) return 1;

  return 0;
};

export const resolveRuleConditions = <
  const Context,
  const Conditions extends RuleConditions<Context>
>({
  rule,
  context,
}: {
  rule: RuleEntry<Context, Conditions>;
  context: any;
}) => {
  if (typeof rule.conditions === "function") {
    return rule.conditions(context ?? {});
  }

  return rule.conditions;
};

export const isBitValid = ({
  bit,
  bits,
}: {
  bits: bigint;
  bit: bigint;
}) => {
  if (!(bits & bit)) {
    return false;
  }

  return true;
};

/** Сравнение двух массивов строк (игнорируя порядок). */
export const areArraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  return sortedA.every((val, idx) => val === sortedB[idx]);
};