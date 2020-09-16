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
  isOk(): boolean {
    return this.inner.isOk;
  }
  isErr(): boolean {
    return !this.inner.isOk;
  }

  unwrap(): T {
    if (!this.inner.isOk) {
      throw new Error('Result: cannot unwrap value if err.');
    }
    return this.inner.value;
  }
  unwrapErr(): E {
    if (this.inner.isOk) {
      throw new Error('Result: cannot unwrap error if ok.');
    }
    return this.inner.error;
  }
  unwrapOr(alternate: T): T {
    return this.inner.isOk ? this.inner.value : alternate;
  }
  unwrapOrElse(alter: (error: E) => T): T {
    return this.inner.isOk ? this.inner.value : alter(this.inner.error);
  }
  match<U>(matcher: ResultMatcher<T, E, U>): U {
    return this.inner.isOk
      ? matcher.ok(this.inner.value)
      : matcher.err(this.inner.error);
  }

  map<U>(transform: (value: T) => U): Result<U, E> {
    return this.inner.isOk
      ? ok(transform(this.inner.value))
      : err(this.inner.error);
  }
  async mapAsync<U>(
    transform: (value: T) => Promise<U>,
  ): Promise<Result<U, E>> {
    return this.inner.isOk
      ? ok(await transform(this.inner.value))
      : err(this.inner.error);
  }

  mapErr<EU>(transform: (error: E) => EU): Result<T, EU> {
    return this.inner.isOk
      ? ok(this.inner.value)
      : err(transform(this.inner.error));
  }
  async mapErrAsync<EU>(
    transform: (error: E) => Promise<EU>,
  ): Promise<Result<T, EU>> {
    return this.inner.isOk
      ? ok(this.inner.value)
      : err(await transform(this.inner.error));
  }

  andThen<U, EU = E>(
    transform: (value: T) => Result<U, EU>,
  ): Result<U, E | EU> {
    return this.inner.isOk
      ? transform(this.inner.value)
      : err(this.inner.error);
  }
  async andThenAsync<U, EU = E>(
    transform: (value: T) => Promise<Result<U, EU>>,
  ): Promise<Result<U, E | EU>> {
    return this.inner.isOk
      ? await transform(this.inner.value)
      : err(this.inner.error);
  }

  orElse<EU = E>(alter: (error: E) => Result<T, EU>): Result<T, EU> {
    return this.inner.isOk ? ok(this.inner.value) : alter(this.inner.error);
  }
  async orElseAsync<EU = E>(
    alter: (error: E) => Promise<Result<T, EU>>,
  ): Promise<Result<T, EU>> {
    return this.inner.isOk
      ? ok(this.inner.value)
      : await alter(this.inner.error);
  }

  and<U, EU = E>(replace: Result<U, EU>): Result<U, E | EU> {
    return this.inner.isOk ? replace : err(this.inner.error);
  }
  or<EU = E>(replace: Result<T, EU>): Result<T, EU> {
    return this.inner.isOk ? ok(this.inner.value) : replace;
  }

  static begin(): Result<void, never> {
    return ok();
  }
  static challenge<T>(f: () => T): Result<T, unknown> {
    try {
      return ok(f());
    } catch (e) {
      return err(e);
    }
  }
}

export function ok<T>(value: T): Result<T, never>;
export function ok(): Result<undefined, never>;
export function ok<T>(value?: T): Result<T, never> | Result<undefined, never> {
  if (value === undefined) {
    return new Result({ isOk: true, value: undefined });
  }
  return new Result({ isOk: true, value });
}

export function err<E>(error: E): Result<never, E>;
export function err(): Result<never, undefined>;
export function err<E>(error?: E): Result<never, E> | Result<never, undefined> {
  if (error === undefined) {
    return new Result({ isOk: false, error: undefined });
  }
  return new Result<never, E>({ isOk: false, error });
}
