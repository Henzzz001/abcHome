import { permissions } from "./permissions";

type NestedValues<T> = T extends Record<string, infer V>
  ? V extends string
    ? V
    : NestedValues<V>
  : never;

export type Permission = NestedValues<typeof permissions>;