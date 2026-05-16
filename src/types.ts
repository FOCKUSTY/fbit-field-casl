import type { AnyAbility, SubjectType } from "@casl/ability";
import { BitFieldInput } from "fbit-field";

export type Prettify<T> = {
  [P in keyof T]: T[P];
} & {};

export type Conditions = Record<string, any>;
export type RuleConditions<Context> =
  | Conditions
  | ((context: Context) => Conditions);

export interface RuleEntry<
  Context,
> {
  id?: string;

  action: string;
  subject: string;

  fields?: string[];
  isInverted?: boolean;

  conditions?: RuleConditions<Context>;
}

export type RuleMap<Context> = Map<
  bigint,
  RuleEntry<Context>
>;

export type WithSubjectType<T> = T & {
  subject: SubjectType | SubjectType[];
};

export type Ability = Prettify<
  AnyAbility & {
    rules: WithSubjectType<AnyAbility["rules"][number]>[];
  }
>;

export type AbilityOptions = {
  /** Фабрика для создания ability (по умолчанию createMongoAbility) */
  abilityFactory?: () => Ability;
  context?: Record<string, any>;
  sortBits?: (a: bigint, b: bigint) => number;
}

export type AbilityTransformerOptions = {
  /**
   * Если true, при неоднозначности выбрасывается ошибка.
   * Иначе выбирается бит с наименьшим значением.
   */
  isStrict?: boolean;
}

export type RawRuleMap<
  Context,
> = Map<bigint, RuleEntry<Context>>;

export type RuleMapType<
  Context,
> = {
  offset: BitFieldInput | RawRuleMap<Context> | RuleMapType<Context>;
  map: RawRuleMap<Context>;
}
