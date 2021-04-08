// tracing: off

import * as R from "../Collections/Immutable/Dictionary"
import type { _E, _R, EnforceNonEmptyRecord } from "../Utils"
import type { Effect } from "./effect"
import { forEach_, forEachPar_, forEachParN_ } from "./excl-forEach"
import { map_ } from "./map"

/**
 * Applicative structure
 */
export function struct<NER extends Record<string, Effect<any, any, any>>>(
  r: EnforceNonEmptyRecord<NER> & Record<string, Effect<any, any, any>>,
  __trace?: string
): Effect<
  _R<NER[keyof NER]>,
  _E<NER[keyof NER]>,
  {
    [K in keyof NER]: [NER[K]] extends [Effect<any, any, infer A>] ? A : never
  }
> {
  return map_(
    forEach_(
      R.collect_(r, (k, v) => [k, v] as const),
      ([_, e]) => map_(e, (a) => [_, a] as const),
      __trace
    ),
    (values) => {
      const res = {}
      values.forEach(([k, v]) => {
        res[k] = v
      })
      return res
    }
  ) as any
}

/**
 * Applicative structure processed in parallel
 */
export function structPar<NER extends Record<string, Effect<any, any, any>>>(
  r: EnforceNonEmptyRecord<NER> & Record<string, Effect<any, any, any>>,
  __trace?: string
): Effect<
  _R<NER[keyof NER]>,
  _E<NER[keyof NER]>,
  {
    [K in keyof NER]: [NER[K]] extends [Effect<any, any, infer A>] ? A : never
  }
> {
  return map_(
    forEachPar_(
      R.collect_(r, (k, v) => [k, v] as const),
      ([_, e]) => map_(e, (a) => [_, a] as const),
      __trace
    ),
    (values) => {
      const res = {}
      values.forEach(([k, v]) => {
        res[k] = v
      })
      return res
    }
  ) as any
}

/**
 * Applicative structure processed in parallel with up to N fibers
 *
 * @dataFirst structParN_
 */
export function structParN(n: number, __trace?: string) {
  return <NER extends Record<string, Effect<any, any, any>>>(
    r: EnforceNonEmptyRecord<NER> & Record<string, Effect<any, any, any>>
  ): Effect<
    _R<NER[keyof NER]>,
    _E<NER[keyof NER]>,
    {
      [K in keyof NER]: [NER[K]] extends [Effect<any, any, infer A>] ? A : never
    }
  > =>
    // @ts-expect-error
    structParN_(r, n, __trace)
}

/**
 * Applicative structure processed in parallel with up to N fibers
 */
export function structParN_<NER extends Record<string, Effect<any, any, any>>>(
  r: EnforceNonEmptyRecord<NER> & Record<string, Effect<any, any, any>>,
  n: number,
  __trace?: string
): Effect<
  _R<NER[keyof NER]>,
  _E<NER[keyof NER]>,
  {
    [K in keyof NER]: [NER[K]] extends [Effect<any, any, infer A>] ? A : never
  }
> {
  return map_(
    forEachParN_(
      R.collect_(r, (k, v) => [k, v] as const),
      n,
      ([_, e]) => map_(e, (a) => [_, a] as const),
      __trace
    ),
    (values) => {
      const res = {}
      values.forEach(([k, v]) => {
        res[k] = v
      })
      return res
    }
  ) as any
}
