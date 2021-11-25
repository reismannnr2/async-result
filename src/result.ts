// noinspection JSUnusedGlobalSymbols

import { AsyncResult } from './async-result';

export interface ResultMatcher<T, E, U> {
  ok: (value: T) => U;
  err: (error: E) => U;
}

export type Result<T, E> = Ok<T, E> | Err<E, T>;
export type { Ok, Err };
class Ok<T, E = never> {
  constructor(readonly value: T) {}

  /**
   * returns currently ok or not
   */
  isOk: true = true;

  /**
   * returns currently err or not
   */
  isErr: false = false;

  *[Symbol.iterator](): Iterator<T> {
    yield this.value;
  }

  /**
   * returns inner value if ok, throws an Error if err
   */
  unwrap(): T {
    return this.value;
  }

  /**
   * returns inner error if err, throws an Error if ok
   */
  unwrapErr(): E {
    throw new Error('Result: cannot unwrap error if ok.');
  }

  /**
   * returns inner value, or given alternate value if err
   * @param alternate value
   */
  unwrapOr(alternate: T): T {
    return this.value;
  }

  /**
   * returns inner value, or evaluate given function if err
   * @param alter
   */
  unwrapOrElse(alter: (error: E) => T): T {
    return this.value;
  }

  /**
   * evaluates given ok or err function, corresponding to current status
   * @param matcher
   */
  match<U>(matcher: ResultMatcher<T, E, U>): U {
    return matcher.ok(this.value);
  }

  /**
   * transforms inner value, or does nothing if err
   * @param transform
   */
  map<U>(transform: (value: T) => U): Ok<U, E> {
    return new Ok(transform(this.value));
  }

  /**
   * transforms inner value, or does nothing if err
   * It accepts a function which returns a Promise, and it returns a Result wrapped in Promise too.
   * Use this to avoid getting Result<Promise<U>, E>.
   * @param transform
   */
  async mapAsync<U>(transform: (value: T) => Promise<U>): Promise<Ok<U, E>> {
    return new Ok(await transform(this.value));
  }

  /**
   * transforms inner error, or does nothing if ok
   * @param transform
   */
  mapErr<EU>(transform: (error: E) => EU): Ok<T, EU> {
    // Does not have E type actually
    return this as unknown as Ok<T, EU>;
  }

  /**
   * transforms inner error, or does nothing if ok
   * It accepts a function which returns a Promise, and it returns a Result wrapped in Promise too.
   * Use this to avoid getting Result<T, Promise<EU>>.
   * @param transform
   */
  async mapErrAsync<EU>(
    transform: (error: E) => Promise<EU>,
  ): Promise<Ok<T, EU>> {
    // Does not have E type actually
    return this as unknown as Ok<T, EU>;
  }

  /**
   * transforms inner value, by a function which may fail, or does nothing if err.
   * @param transform
   */
  andThen<U, EU = E>(
    transform: (value: T) => Result<U, EU>,
  ): Result<U, E | EU> {
    return transform(this.value);
  }

  /**
   * transforms inner value,  by a function which may fail, or does nothing if err.
   * It accepts a function which returns a Promise, and it returns a Result wrapped in Promise too.
   * Use this to avoid getting Result<Promise<U>, E>.
   * @param transform
   */
  async andThenAsync<U, EU = E>(
    transform: (value: T) => Promise<Result<U, EU>>,
  ): Promise<Result<U, E | EU>> {
    return await transform(this.value);
  }

  /**
   * transforms inner error into successful result or a new err, or does nothing if ok.
   * @param alter
   */
  orElse<EU = E>(alter: (error: E) => Result<T, EU>): Ok<T, EU> {
    // Does not have E type actually
    return this as unknown as Ok<T, EU>;
  }

  /**
   * transforms inner error into successful result or a new err, or does nothing if ok.
   * It accepts a function which returns a Promise, and it returns a Result wrapped in Promise too.
   * Use this to avoid getting Result<T, Promise<EU>>.
   * @param alter
   */
  async orElseAsync<EU = E>(
    alter: (error: E) => Promise<Result<T, EU>>,
  ): Promise<Ok<T, EU>> {
    // Does not have E type actually
    return this as unknown as Ok<T, EU>;
  }

  /**
   * replace the result if currently ok, or does nothing if err.
   * @param replace
   */
  and<U, EU = E>(replace: Result<U, EU>): Result<U, E | EU> {
    return replace;
  }

  /**
   * replace the result if currently err, or does nothing if ok.
   * @param replace
   */
  or<EU = E>(replace: Result<T, EU>): Ok<T, EU> {
    return this as unknown as Ok<T, EU>;
  }

  /**
   * Convert error type into never for typescript usage.
   */
  always(): Ok<T> {
    // Does not have E type actually
    return this as unknown as Ok<T>;
  }

  /**
   * transform this into an AsyncResult
   */
  toAsync(): AsyncResult<T, E> {
    return new AsyncResult<T, E>(Promise.resolve(this));
  }
}

class Err<E, T = never> {
  constructor(readonly error: E) {}

  /**
   * returns currently ok or not
   */
  isOk: false = false;

  /**
   * returns currently err or not
   */
  isErr: true = true;

  *[Symbol.iterator](): Iterator<never> {}

  /**
   * returns inner value if ok, throws an Error if err
   */
  unwrap(): T {
    throw new Error('Result: cannot unwrap value if err.');
  }

  /**
   * returns inner error if err, throws an Error if ok
   */
  unwrapErr(): E {
    return this.error;
  }

  /**
   * returns inner value, or given alternate value if err
   * @param alternate value
   */
  unwrapOr(alternate: T): T {
    return alternate;
  }

  /**
   * returns inner value, or evaluate given function if err
   * @param alter
   */
  unwrapOrElse(alter: (error: E) => T): T {
    return alter(this.error);
  }

  /**
   * evaluates given ok or err function, corresponding to current status
   * @param matcher
   */
  match<U>(matcher: ResultMatcher<T, E, U>): U {
    return matcher.err(this.error);
  }

  /**
   * transforms inner value, or does nothing if err
   * @param transform
   */
  map<U>(transform: (value: T) => U): Err<E, U> {
    // Does not have T type actually
    return this as unknown as Err<E, U>;
  }

  /**
   * transforms inner value, or does nothing if err
   * It accepts a function which returns a Promise, and it returns a Result wrapped in Promise too.
   * Use this to avoid getting Result<Promise<U>, E>.
   * @param transform
   */
  async mapAsync<U>(transform: (value: T) => Promise<U>): Promise<Err<E, U>> {
    // Does not have T type actually
    return this as unknown as Err<E, U>;
  }

  /**
   * transforms inner error, or does nothing if ok
   * @param transform
   */
  mapErr<EU>(transform: (error: E) => EU): Err<EU, T> {
    return new Err(transform(this.error));
  }

  /**
   * transforms inner error, or does nothing if ok
   * It accepts a function which returns a Promise, and it returns a Result wrapped in Promise too.
   * Use this to avoid getting Result<T, Promise<EU>>.
   * @param transform
   */
  async mapErrAsync<EU>(
    transform: (error: E) => Promise<EU>,
  ): Promise<Err<EU, T>> {
    return new Err(await transform(this.error));
  }

  /**
   * transforms inner value, by a function which may fail, or does nothing if err.
   * @param transform
   */
  andThen<U, EU = E>(
    transform: (value: T) => Result<U, EU>,
  ): Result<U, E | EU> {
    // Does not have T type actually
    return this as unknown as Err<E, U>;
  }

  /**
   * transforms inner value,  by a function which may fail, or does nothing if err.
   * It accepts a function which returns a Promise, and it returns a Result wrapped in Promise too.
   * Use this to avoid getting Result<Promise<U>, E>.
   * @param transform
   */
  async andThenAsync<U, EU = E>(
    transform: (value: T) => Promise<Result<U, EU>>,
  ): Promise<Result<U, E | EU>> {
    // Does not have T type actually
    return this as unknown as Err<E, U>;
  }

  /**
   * transforms inner error into successful result or a new err, or does nothing if ok.
   * @param alter
   */
  orElse<EU = E>(alter: (error: E) => Result<T, EU>): Result<T, EU> {
    return alter(this.error);
  }

  /**
   * transforms inner error into successful result or a new err, or does nothing if ok.
   * It accepts a function which returns a Promise, and it returns a Result wrapped in Promise too.
   * Use this to avoid getting Result<T, Promise<EU>>.
   * @param alter
   */
  async orElseAsync<EU = E>(
    alter: (error: E) => Promise<Result<T, EU>>,
  ): Promise<Result<T, EU>> {
    return await alter(this.error);
  }

  /**
   * replace the result if currently ok, or does nothing if err.
   * @param replace
   */
  and<U, EU = E>(replace: Result<U, EU>): Err<E | EU, U> {
    // Does not have T type actually
    return this as unknown as Err<E, U>;
  }

  /**
   * replace the result if currently err, or does nothing if ok.
   * @param replace
   */
  or<EU = E>(replace: Result<T, EU>): Result<T, EU> {
    return replace;
  }

  /**
   * Convert value type into never for typescript usage.
   */
  never(): Err<E> {
    // Does not have T type actually
    return this as unknown as Err<E>;
  }

  /**
   * transform this into an AsyncResult
   */
  toAsync(): AsyncResult<T, E> {
    return new AsyncResult<T, E>(Promise.resolve(this));
  }
}

export const Result = {
  /**
   * just begin a failable process.
   */
  begin(): Result<void, never> {
    return new Ok(undefined);
  },
  /**
   * converts the exception into err if given function throws,
   * @param f
   */
  challenge<T, E = unknown>(f: () => T): Result<T, E> {
    try {
      return new Ok(f());
    } catch (e) {
      return new Err(e as unknown as E);
    }
  },
};

/**
 * returns successful result.
 * @param value
 */
export function ok<T>(value: T): Ok<T>;
/**
 * returns successful result.
 */
export function ok(): Ok<undefined>;
export function ok<T>(value?: T): Ok<T> | Ok<undefined> {
  if (value === undefined) {
    return new Ok(undefined);
  }
  return new Ok(value);
}

/**
 * returns failed result.
 * @param error
 */
export function err<E>(error: E): Err<E>;
/**
 * returns failed result.
 */
export function err(): Err<undefined>;
export function err<E>(error?: E): Err<E> | Err<undefined> {
  if (error === undefined) {
    return new Err(undefined);
  }
  return new Err(error);
}
