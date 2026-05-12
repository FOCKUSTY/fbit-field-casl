import type { AnyAbility, SubjectType } from "@casl/ability";

export type Prettify<T> = {
  [P in keyof T]: T[P];
} & {};

export type Conditions<T extends Record<string, any> = Record<string, any>> = T;
export type RuleConditions<Context> =
  | Conditions
  | ((context: Context) => Conditions);

export interface RuleEntry<
  Context,
  Conditions extends RuleConditions<Context>
> {
  id?: string;

  action: string;
  subject: string;

  fields?: string[];
  isInverted?: boolean;

  conditions: Conditions;
}

export type RuleMap<Context, Conditions extends RuleConditions<Context>> = Map<
  bigint,
  RuleEntry<Context, Conditions>
>;

export type WithSubjectType<T> = T & {
  subject: SubjectType | SubjectType[];
};

export type Ability = Prettify<
  AnyAbility & {
    rules: WithSubjectType<AnyAbility["rules"][number]>[];
  }
>;

export interface AbilityOptions {
  /** Фабрика для создания ability (по умолчанию createMongoAbility) */
  abilityFactory?: () => Ability;
  context?: Record<string, any>;
  sortBits?: (a: bigint, b: bigint) => number;
}

export interface AbilityToBitsOptions {
  /**
   * Если true, при неоднозначности выбрасывается ошибка.
   * Иначе выбирается бит с наименьшим значением.
   */
  isStrict?: boolean;
}
