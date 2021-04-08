// tracing: off

import * as A from "../Collections/Immutable/Array"
import type { ExecutionStrategy } from "../Effect/ExecutionStrategy"
import { sequential } from "../Effect/ExecutionStrategy"
import { tuple } from "../Function"
import { makeManagedReleaseMap, mapM_ } from "./core"
import * as T from "./deps"
import { Managed } from "./managed"
import type { Finalizer } from "./ReleaseMap/finalizer"

/**
 * Applies the function `f` to each element of the `Iterable<A>` and
 * returns the results in a new `B[]`.
 *
 * For a parallel version of this method, see `forEachPar`.
 * If you do not need the results, see `forEachUnit` for a more efficient implementation.
 *
 * @dataFirst forEach_
 */
export function forEach<R, E, A, B>(f: (a: A) => Managed<R, E, B>, __trace?: string) {
  return (as: Iterable<A>) => forEach_(as, f, __trace)
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` and
 * returns the results in a new `B[]`.
 *
 * For a parallel version of this method, see `forEachPar_`.
 * If you do not need the results, see `forEachUnit_` for a more efficient implementation.
 */
export function forEach_<R, E, A, B>(
  as: Iterable<A>,
  f: (a: A) => Managed<R, E, B>,
  __trace?: string
) {
  return new Managed<R, E, readonly B[]>(
    T.map_(
      T.forEach_(as, (a) => f(a).effect, __trace),
      (res) => {
        const fins = res.map((k) => k[0])
        const as = res.map((k) => k[1])

        return [(e) => T.forEach_(fins.reverse(), (fin) => fin(e), __trace), as]
      }
    )
  )
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` in parallel,
 * and returns the results in a new `readonly B[]`.
 *
 * For a sequential version of this method, see `forEach`.
 */
export function forEachExec_<R, E, A, B>(
  as: Iterable<A>,
  es: ExecutionStrategy,
  f: (a: A) => Managed<R, E, B>,
  __trace?: string
) {
  switch (es._tag) {
    case "Sequential": {
      return forEach_(as, f, __trace)
    }
    case "Parallel": {
      return forEachPar_(as, f, __trace)
    }
    case "ParallelN": {
      return forEachParN_(as, es.n, f, __trace)
    }
  }
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` in parallel,
 * and returns the results in a new `readonly B[]`.
 *
 * For a sequential version of this method, see `forEach`.
 *
 * @dataFirst forEachExec_
 */
export function forEachExec<R, E, A, B>(
  es: ExecutionStrategy,
  f: (a: A) => Managed<R, E, B>,
  __trace?: string
) {
  return (as: Iterable<A>) => forEachExec_(as, es, f, __trace)
}

/**
 * Applies the function `f` to each element of the `Iterable[A]` and runs
 * produced effects sequentially.
 *
 * Equivalent to `forEach(as)(f).unit`, but without the cost of building
 * the list of results.
 */
export function forEachUnit_<R, E, A, B>(
  as: Iterable<A>,
  f: (a: A) => Managed<R, E, B>,
  __trace?: string
) {
  return new Managed<R, E, void>(
    T.map_(
      T.forEach_(as, (a) => f(a).effect, __trace),
      (result) => {
        const [fins] = A.unzip(result)
        return tuple<[Finalizer, void]>(
          (e) => T.forEach_(A.reverse(fins), (f) => f(e), __trace),
          undefined
        )
      }
    )
  )
}

/**
 * Applies the function `f` to each element of the `Iterable[A]` and runs
 * produced effects sequentially.
 *
 * Equivalent to `forEach(as)(f).unit`, but without the cost of building
 * the list of results.
 *
 * @dataFirst forEachUnit_
 */
export function forEachUnit<R, E, A, B>(
  f: (a: A) => Managed<R, E, B>,
  __trace?: string
) {
  return (as: Iterable<A>) => forEachUnit_(as, f, __trace)
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` in parallel,
 * and returns the results in a new `B[]`.
 *
 * For a sequential version of this method, see `forEach`.
 *
 * @dataFirst forEachPar_
 */
export function forEachPar<R, E, A, B>(
  f: (a: A) => Managed<R, E, B>,
  __trace?: string
) {
  return (as: Iterable<A>): Managed<R, E, readonly B[]> => forEachPar_(as, f, __trace)
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` in parallel,
 * and returns the results in a new `B[]`.
 *
 * For a sequential version of this method, see `forEach_`.
 */
export function forEachPar_<R, E, A, B>(
  as: Iterable<A>,
  f: (a: A) => Managed<R, E, B>,
  __trace?: string
): Managed<R, E, readonly B[]> {
  return mapM_(makeManagedReleaseMap(T.parallel, __trace), (parallelReleaseMap) => {
    const makeInnerMap = T.provideSome_(
      T.map_(makeManagedReleaseMap(sequential).effect, ([_, x]) => x),
      (x: unknown) => tuple(x, parallelReleaseMap)
    )

    return T.forEachPar_(as, (a) =>
      T.map_(
        T.chain_(makeInnerMap, (innerMap) =>
          T.provideSome_(f(a).effect, (u: R) => tuple(u, innerMap))
        ),
        ([_, b]) => b
      )
    )
  })
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` in parallel,
 * and returns the results in a new `B[]`.
 *
 * Unlike `forEachPar`, this method will use at most up to `n` fibers.
 *
 * @dataFirst forEachParN_
 */
export function forEachParN<R, E, A, B>(
  n: number,
  f: (a: A) => Managed<R, E, B>,
  __trace?: string
) {
  return (as: Iterable<A>): Managed<R, E, readonly B[]> =>
    forEachParN_(as, n, f, __trace)
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` in parallel,
 * and returns the results in a new `B[]`.
 *
 * Unlike `forEachPar_`, this method will use at most up to `n` fibers.
 */
export function forEachParN_<R, E, A, B>(
  as: Iterable<A>,
  n: number,
  f: (a: A) => Managed<R, E, B>,
  __trace?: string
): Managed<R, E, readonly B[]> {
  return mapM_(makeManagedReleaseMap(T.parallelN(n), __trace), (parallelReleaseMap) => {
    const makeInnerMap = T.provideSome_(
      T.map_(makeManagedReleaseMap(sequential).effect, ([_, x]) => x),
      (x: unknown) => tuple(x, parallelReleaseMap)
    )

    return T.forEachParN_(as, n, (a) =>
      T.map_(
        T.chain_(makeInnerMap, (innerMap) =>
          T.provideSome_(f(a).effect, (u: R) => tuple(u, innerMap))
        ),
        ([_, b]) => b
      )
    )
  })
}
