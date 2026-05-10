import type { AnyAbility, SubjectType } from "@casl/ability";

export interface RuleEntry {
  action: string;
  subject: string;
  id?: string;
  conditions?: Record<string, any> | ((context: any) => Record<string, any>);
  fields?: string[];
  isInverted?: boolean;
}

export interface Rule {
  action: string;
  subject: string;
  conditions?: any;
  isInverted: boolean;
  id?: string;
}

export type WithSubjectType<T> = T & {
  subject: SubjectType | SubjectType[];
};

export type Ability = AnyAbility & {
  rules: WithSubjectType<AnyAbility["rules"][number]>[];
};

export interface CreateAbilityFromBitsOptions {
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
