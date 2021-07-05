import { AsyncResult } from './async-result';

interface InnerOk<T> {
  isOk: true;
  value: T;
}

interface InnerErr<E> {
  isOk: false;
  error: E;
}

type InnerResult<T, E> = InnerOk<T> | InnerErr<E>;

export interface ResultMatcher<T, E, U> {
  ok: (value: T) => U;
  err: (error: E) => U;
}

export class Result<T, E> {
  constructor(private readonly inner: InnerResult<T, E>) {}

  /**
   * returns currently ok or not
   */
  isOk(): boolean {
    return this.inner.isOk;
  }

  /**
   * returns currently err or not
   */
  isErr(): boolean {
    return !this.inner.isOk;
  }

  /**
   * returns inner value if ok, throws an Error if err
   */
  unwrap(): T {
    if (!this.inner.isOk) {
      throw new Error('Result: cannot unwrap value if err.');
    }
    return this.inner.value;
  }

  /**
   * returns inner error if err, throws an Error if ok
   */
  unwrapErr(): E {
    if (this.inner.isOk) {
      throw new Error('Result: cannot unwrap error if ok.');
    }
    return this.inner.error;
  }

  /**
   * returns inner value, or given alternate value if err
   * @param alternate value
   */
  unwrapOr(alternate: T): T {
    return this.inner.isOk ? this.inner.value : alternate;
  }

  /**
   * returns inner value, or evaluate given function if err
   * @param alter
   */
  unwrapOrElse(alter: (error: E) => T): T {
    return this.inner.isOk ? this.inner.value : alter(this.inner.error);
  }

  /**
   * evaluates given ok or err function, corresponding to current status
   * @param matcher
   */
  match<U>(matcher: ResultMatcher<T, E, U>): U {
    return this.inner.isOk
      ? matcher.ok(this.inner.value)
      : matcher.err(this.inner.error);
  }

  /**
   * transforms inner value, or does nothing if err
   * @param transform
   */
  map<U>(transform: (value: T) => U): Result<U, E> {
    return this.inner.isOk
      ? ok(transform(this.inner.value))
      : err(this.inner.error);
  }

  /**
   * transforms inner value, or does nothing if err
   * It accepts a function which returns a Promise, and it returns a Result wrapped in Promise too.
   * Use this to avoid getting Result<Promise<U>, E>.
   * @param transform
   */
  async mapAsync<U>(
    transform: (value: T) => Promise<U>,
  ): Promise<Result<U, E>> {
    return this.inner.isOk
      ? ok(await transform(this.inner.value))
      : err(this.inner.error);
  }

  /**
   * transforms inner error, or does nothing if ok
   * @param transform
   */
  mapErr<EU>(transform: (error: E) => EU): Result<T, EU> {
    return this.inner.isOk
      ? ok(this.inner.value)
      : err(transform(this.inner.error));
  }

  /**
   * transforms inner error, or does nothing if ok
   * It accepts a function which returns a Promise, and it returns a Result wrapped in Promise too.
   * Use this to avoid getting Result<T, Promise<EU>>.
   * @param transform
   */
  async mapErrAsync<EU>(
    transform: (error: E) => Promise<EU>,
  ): Promise<Result<T, EU>> {
    return this.inner.isOk
      ? ok(this.inner.value)
      : err(await transform(this.inner.error));
  }

  /**
   * transforms inner value, by a function which may fail, or does nothing if err.
   * @param transform
   */
  andThen<U, EU = E>(
    transform: (value: T) => Result<U, EU>,
  ): Result<U, E | EU> {
    return this.inner.isOk
      ? transform(this.inner.value)
      : err(this.inner.error);
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
    return this.inner.isOk
      ? await transform(this.inner.value)
      : err(this.inner.error);
  }

  /**
   * transforms inner error into successful result or a new err, or does nothing if ok.
   * @param alter
   */
  orElse<EU = E>(alter: (error: E) => Result<T, EU>): Result<T, EU> {
    return this.inner.isOk ? ok(this.inner.value) : alter(this.inner.error);
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
    return this.inner.isOk
      ? ok(this.inner.value)
      : await alter(this.inner.error);
  }

  /**
   * replace the result if currently ok, or does nothing if err.
   * @param replace
   */
  and<U, EU = E>(replace: Result<U, EU>): Result<U, E | EU> {
    return this.inner.isOk ? replace : err(this.inner.error);
  }

  /**
   * replace the result if currently err, or does nothing if ok.
   * @param replace
   */
  or<EU = E>(replace: Result<T, EU>): Result<T, EU> {
    return this.inner.isOk ? ok(this.inner.value) : replace;
  }

  /**
   * transform this into an AsyncResult
   */
  toAsync(): AsyncResult<T, E> {
    return new AsyncResult<T, E>(Promise.resolve(this));
  }

  /**
   * just begin a failable process.
   */
  static begin(): Result<void, never> {
    return ok();
  }

  /**
   * converts the exception into err if given function throws,
   * @param f
   */
  static challenge<T>(f: () => T): Result<T, unknown> {
    try {
      return ok(f());
    } catch (e) {
      return err(e);
    }
  }
}

/**
 * returns successful result.
 * @param value
 */
export function ok<T>(value: T): Result<T, never>;
/**
 * returns successful result.
 */
export function ok(): Result<undefined, never>;
export function ok<T>(value?: T): Result<T, never> | Result<undefined, never> {
  if (value === undefined) {
    return new Result({ isOk: true, value: undefined });
  }
  return new Result({ isOk: true, value });
}

/**
 * returns failed result.
 * @param error
 */
export function err<E>(error: E): Result<never, E>;
/**
 * returns failed result.
 */
export function err(): Result<never, undefined>;
export function err<E>(error?: E): Result<never, E> | Result<never, undefined> {
  if (error === undefined) {
    return new Result({ isOk: false, error: undefined });
  }
  return new Result<never, E>({ isOk: false, error });
}
