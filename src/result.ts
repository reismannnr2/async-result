import { None, none, Option, some, Some } from './option';
import { AsyncResult } from 'src/async-result';

export interface ResultMatcher<T, E, R> {
  ok: (value: T) => R;
  err: (error: E) => R;
}

interface ResultBase<T, E> {
  /**
   * currently ok or not
   */
  isOk: boolean;
  /**
   * currently err or not
   */
  isErr: boolean;

  [Symbol.iterator](): Iterator<T>;

  /**
   * returns inner successful value if ok,
   * otherwise throws
   */
  unwrap(): T;

  /**
   * returns inner error value if err,
   * otherwise throws
   */
  unwrapErr(): E;

  /**
   * returns inner successful value if ok,
   * otherwise given alternate value
   */
  unwrapOr<U = T>(alternate: U): T | U;

  /**
   * returns inner successful value if ok,
   * otherwise the result of given alter function
   */
  unwrapOrElse<U = T>(alter: (error: E) => U): T | U;

  /**
   * returns the result of the matcher function corresponding to current state
   * calls ok if ok, err if err
   * @param matcher
   */
  match<R>(matcher: ResultMatcher<T, E, R>): R;

  /**
   * returns inner value transformed Ok if ok,
   * otherwise just current Err<E>
   * @param transform
   */
  map<U>(transform: (value: T) => U): Result<U, E>;

  /**
   * returns just current Ok<T> if ok,
   * otherwise inner error transformed Err
   * @param transform
   */
  mapErr<EU>(transform: (error: E) => EU): Result<T, EU>;

  /**
   * returns a new result created by given function with inner value if ok,
   * otherwise just current Err
   * @param transform
   */
  andThen<U, EU = E>(transform: (value: T) => Result<U, EU>): Result<U, E | EU>;

  /**
   * returns just current Ok<T> if ok
   * otherwise a new result created by given function with inner value if some,
   * @param transform
   */
  orElse<EU, U = T>(transform: (error: E) => Result<U, EU>): Result<T | U, EU>;

  /**
   * returns given replace result if ok,
   * otherwise just current Err
   * @param replace
   */
  and<U, EU = E>(replace: Result<U, EU>): Result<U, E | EU>;

  /**
   * returns just current Ok if ok,
   * otherwise given alternate result
   * @param alternate
   */
  or<EU, U = T>(alternate: Result<U, EU>): Result<T | U, EU>;

  /**
   * returns the result of predicate if ok,
   * otherwise just false
   * @param predicate
   */
  test(predicate: (value: T) => boolean): boolean;

  /**
   * returns optional value Some<T> if ok,
   * otherwise just None, discard error if err
   */
  toOption(): Option<T>;

  /**
   * call given function and returns the result of it if ok,
   * otherwise just current Err,
   * returns Err<unknown> if it throws
   * @param f
   */
  try<U>(f: (value: T) => Result<U, unknown>): Result<U, unknown>;
}

interface PromiseResult<T, E> {
  /**
   * returns inner value transformed Ok if ok,
   * otherwise just current Err<E>
   * both wrapped in promise, use this to avoid messy Result<Promise<T>, E>
   * @param transform
   */
  mapAsync<U>(transform: (value: T) => U | Promise<U>): Promise<Result<U, E>>;

  /**
   * returns just current Ok<T> if ok,
   * otherwise inner error transformed Err
   * both wrapped in promise, use this to avoid messy Result<T, Promise<EU>>
   * @param transform
   */
  mapErrAsync<EU>(
    transform: (error: E) => EU | Promise<EU>,
  ): Promise<Result<T, EU>>;

  /**
   * returns a new result created by given function with inner value if ok,
   * otherwise just current Err
   * both wrapped in promise, use this to avoid messy Result<Promise<T, EU>, E>
   * @param transform
   */
  andThenAsync<U, EU = E>(
    transform: (value: T) => Result<U, EU> | Promise<Result<U, EU>>,
  ): Promise<Result<U, E | EU>>;

  /**
   * returns just current Ok<T> if ok
   * otherwise a new result created by given function with inner value if some,
   * both wrapped in promise, use this to avoid messy Result<T, Promise<U, EU>>
   * @param transform
   */
  orElseAsync<EU, U = T>(
    transform: (error: E) => Result<U, EU> | Promise<Result<U, EU>>,
  ): Promise<Result<T | U, EU>>;

  /**
   * returns the result of predicate if ok,
   * otherwise just false
   * both wrapped in promise
   * @param predicate
   */
  testAsync(
    predicate: (value: T) => boolean | Promise<boolean>,
  ): Promise<boolean>;

  /**
   * call given function and returns the result of it if ok,
   * otherwise just current Err,
   * returns Err<unknown> if it throws
   * both wrapped in promise, use this to avoid messy Result<Promise<U, unknown>, E>
   * @param f
   */
  tryAsync<U>(
    f: (value: T) => Result<U, unknown> | Promise<Result<U, unknown>>,
  ): Promise<Result<U, unknown>>;

  /**
   * Wrap in AsyncResult<T, E>, to start asynchronous process
   */
  toAsync(): AsyncResult<T, E>;
}

export type { Ok, Err };
export type Result<T, E> = Ok<T, E> | Err<E, T>;

class Ok<T, E = never> implements ResultBase<T, E>, PromiseResult<T, E> {
  isOk: true = true;
  isErr: false = false;
  constructor(readonly value: T) {}

  /**
   * Utility function for type coercion.
   * Actually Ok does not have E error.
   */
  always(): Ok<T> {
    return this as unknown as Ok<T>;
  }

  *[Symbol.iterator](): Iterator<T> {
    yield this.value;
  }

  unwrap(): T {
    return this.value;
  }
  unwrapErr(): never {
    throw new Error('Cannot unwrapErr from Ok');
  }
  unwrapOr<U = T>(alternate: U): T {
    return this.value;
  }
  unwrapOrElse<U = T>(alter: (error: E) => U): T {
    return this.value;
  }
  match<R>(matcher: ResultMatcher<T, E, R>): R {
    return matcher.ok(this.value);
  }
  map<U>(transform: (value: T) => U): Ok<U, E> {
    return ok(transform(this.value));
  }
  mapErr<EU>(transform: (error: E) => EU): Ok<T, EU> {
    return this as unknown as Ok<T>;
  }
  andThen<U, EU = E>(transform: (value: T) => Result<U, EU>): Result<U, EU> {
    return transform(this.value);
  }
  orElse<EU, U = T>(transform: (error: E) => Result<U, EU>): Ok<T, EU> {
    return this as unknown as Ok<T>;
  }
  and<U, EU = E>(replace: Result<U, EU>): Result<U, EU> {
    return replace;
  }
  or<EU, U = T>(alternate: Result<U, EU>): Result<T, EU> {
    return this as unknown as Ok<T>;
  }
  test(predicate: (value: T) => boolean): boolean {
    return predicate(this.value);
  }
  toOption(): Some<T> {
    return some(this.value);
  }
  try<U>(f: (value: T) => Result<U, unknown>): Result<U, unknown> {
    try {
      return f(this.value);
    } catch (e) {
      return err(e);
    }
  }
  async mapAsync<U>(
    transform: (value: T) => Promise<U> | U,
  ): Promise<Ok<U, E>> {
    return ok(await transform(this.value));
  }
  async mapErrAsync<EU>(
    transform: (error: E) => Promise<EU> | EU,
  ): Promise<Result<T, EU>> {
    return this as unknown as Ok<T>;
  }
  async andThenAsync<U, EU = E>(
    transform: (value: T) => Result<U, EU> | Promise<Result<U, EU>>,
  ): Promise<Result<U, E | EU>> {
    return transform(this.value);
  }
  async orElseAsync<EU, U = T>(
    transform: (error: E) => Result<U, EU> | Promise<Result<U, EU>>,
  ): Promise<Ok<T, EU>> {
    return this as unknown as Ok<T>;
  }
  async testAsync(
    predicate: (value: T) => boolean | Promise<boolean>,
  ): Promise<boolean> {
    return predicate(this.value);
  }
  async tryAsync<U>(
    f: (value: T) => Result<U, unknown> | Promise<Result<U, unknown>>,
  ): Promise<Result<U, unknown>> {
    try {
      return await f(this.value);
    } catch (e) {
      return err(e);
    }
  }
  toAsync(): AsyncResult<T, E> {
    return new AsyncResult<T, E>(Promise.resolve(this));
  }
}

class Err<E, T = never> implements ResultBase<T, E>, PromiseResult<T, E> {
  isOk: false = false;
  isErr: true = true;
  constructor(readonly error: E, readonly stack?: string | undefined) {}

  /**
   * Utility function for type coercion.
   * Actually Err does not have T value.
   */
  never(): Err<E> {
    return this as unknown as Err<E>;
  }

  *[Symbol.iterator](): Iterator<never> {}

  unwrap(): never {
    throw new Error('Cannot unwrap Err');
  }
  unwrapErr(): E {
    return this.error;
  }
  unwrapOr<U = T>(alternate: U): U {
    return alternate;
  }
  unwrapOrElse<U = T>(alter: (error: E) => U): U {
    return alter(this.error);
  }
  match<R>(matcher: ResultMatcher<T, E, R>): R {
    return matcher.err(this.error);
  }
  map<U>(transform: (value: T) => U): Err<E, U> {
    return this as unknown as Err<E>;
  }
  mapErr<EU>(transform: (error: E) => EU): Err<EU> {
    return err(transform(this.error));
  }
  andThen<U, EU = E>(transform: (value: T) => Result<U, EU>): Err<E> {
    return this as unknown as Err<E>;
  }
  orElse<EU, U = T>(transform: (error: E) => Result<U, EU>): Result<U, EU> {
    return transform(this.error);
  }
  and<U, EU = E>(replace: Result<U, EU>): Err<E, U> {
    return this as unknown as Err<E>;
  }
  or<EU, U = T>(alternate: Result<U, EU>): Result<U, EU> {
    return alternate;
  }
  test(predicate: (value: T) => boolean): false {
    return false;
  }
  toOption(): None<T> {
    return none();
  }
  try<U>(f: (value: T) => Result<U, unknown>): Err<E> {
    return this as unknown as Err<E>;
  }
  async mapAsync<U>(
    transform: (value: T) => Promise<U> | U,
  ): Promise<Err<E, U>> {
    return this as unknown as Err<E>;
  }
  async mapErrAsync<EU>(
    transform: (error: E) => Promise<EU> | EU,
  ): Promise<Err<EU>> {
    return err(await transform(this.error));
  }
  async andThenAsync<U, EU = E>(
    transform: (value: T) => Result<U, EU> | Promise<Result<U, EU>>,
  ): Promise<Err<E>> {
    return this as unknown as Err<E>;
  }
  async orElseAsync<EU, U = T>(
    transform: (error: E) => Result<U, EU> | Promise<Result<U, EU>>,
  ): Promise<Result<U, EU>> {
    return transform(this.error);
  }
  async testAsync(
    predicate: (value: T) => boolean | Promise<boolean>,
  ): Promise<false> {
    return false;
  }
  async tryAsync<U>(
    f: (value: T) => Result<U, unknown> | Promise<Result<U, unknown>>,
  ): Promise<Err<E>> {
    return this as unknown as Err<E>;
  }
  toAsync(): AsyncResult<T, E> {
    return new AsyncResult<T, E>(Promise.resolve(this));
  }
}

/**
 * returns successful result.
 * @param value
 */
export function ok<T, E = never>(value: T): Ok<T, E>;
/**
 * returns successful result.
 */
export function ok(): Ok<undefined>;
export function ok<T, E = never>(value?: T): Ok<T | undefined, E> {
  return new Ok(value);
}

/**
 * returns failed result.
 * @param error
 */
export function err<E, T = never>(error: E): Err<E, T>;
/**
 * returns failed result.
 */
export function err(): Err<undefined>;
export function err<E, T = never>(error?: E): Err<E | undefined, T> {
  return new Err(error);
}

export const Result = {
  /**
   * return the result of given function wrap in Ok<T> if succeeded,
   * wrap error in Err<E> if thrown.
   * E type is optional and not checked, since exception type cannot be inferred.
   * @param f
   */
  try<T, E = unknown>(f: () => T): Result<T, E> {
    try {
      return ok(f());
    } catch (e) {
      return err(e as unknown as E);
    }
  },
};
