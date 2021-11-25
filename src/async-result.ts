import { err, ok, Ok, Err, Result, ResultMatcher } from './result';

export class AsyncResult<T, E> {
  constructor(
    readonly promise:
      | Promise<Result<T, E>>
      | Promise<Ok<T, E>>
      | Promise<Err<E, T>>,
  ) {}

  /**
   * returns the inner Promise of Result<T, E>
   */
  toPromise(): Promise<Result<T, E>> | Promise<Ok<T, E>> | Promise<Err<E, T>> {
    return this.promise;
  }

  /**
   * transforms inner value, does nothing if err or promise rejected.
   * @param transform
   */
  map<U>(transform: (value: T) => U): AsyncResult<U, E> {
    return new AsyncResult<U, E>(this.promise.then((r) => r.map(transform)));
  }

  /**
   * transforms inner value, does nothing if err or promise rejected.
   * It accepts a function which returns a Promise, and it returns a Result wrapped in Promise too.
   * Use this to avoid getting AsyncResult<Promise<U>, E>.
   * @param transform
   */
  mapAsync<U>(transform: (value: T) => Promise<U>): AsyncResult<U, E> {
    return new AsyncResult<U, E>(
      (async () => {
        const r = await this.promise;
        return r.mapAsync(transform);
      })(),
    );
  }

  /**
   * transforms inner error, or does nothing if ok or promise rejected
   * @param transform
   */
  mapErr<EU>(transform: (error: E) => EU): AsyncResult<T, EU> {
    return new AsyncResult<T, EU>(
      this.promise.then((r) => r.mapErr(transform)),
    );
  }

  /**
   * transforms inner error, or does nothing if ok or promise rejected
   * It accepts a function which returns a Promise, and it returns a Result wrapped in Promise too.
   * Use this to avoid getting AsyncResult<T, Promise<EU>>.
   * @param transform
   */
  mapErrAsync<EU>(transform: (error: E) => Promise<EU>): AsyncResult<T, EU> {
    return new AsyncResult<T, EU>(
      (async () => {
        const r = await this.promise;
        return r.mapErrAsync(transform);
      })(),
    );
  }

  /**
   * transforms inner value, by a function which may fail, or does nothing if err or or promise rejected
   * @param transform
   */
  andThen<U, EU = E>(
    transform: (value: T) => Result<U, EU>,
  ): AsyncResult<U, E | EU> {
    return new AsyncResult<U, E | EU>(
      this.promise.then((r) => r.andThen(transform)),
    );
  }

  /**
   * transforms inner value,  by a function which may fail, or does nothing if err or promise rejected.
   * It accepts a function which returns a Promise, and it returns a Result wrapped in Promise too.
   * Use this to avoid getting AsyncResult<Promise<U>, E>.
   * @param transform
   */
  andThenAsync<U, EU = E>(
    transform: (value: T) => Promise<Result<U, EU>>,
  ): AsyncResult<U, E | EU> {
    return new AsyncResult<U, E | EU>(
      this.promise.then((r) => r.andThenAsync(transform)),
    );
  }

  /**
   * transforms inner error into successful result or a new err, or does nothing if ok.
   * @param alter
   */
  orElse<EU = E>(alter: (error: E) => Result<T, EU>): AsyncResult<T, EU> {
    return new AsyncResult<T, EU>(this.promise.then((r) => r.orElse(alter)));
  }

  /**
   * transforms inner error into successful result or a new err, or does nothing if ok or promise rejected
   * It accepts a function which returns a Promise, and it returns a Result wrapped in Promise too.
   * Use this to avoid getting AsyncResult<T, Promise<EU>>.
   * @param alter
   */
  orElseAsync<EU = E>(
    alter: (error: E) => Promise<Result<T, E | EU>>,
  ): AsyncResult<T, E | EU> {
    return new AsyncResult<T, E | EU>(
      (async () => {
        const r = await this.promise;
        return r.orElseAsync(alter);
      })(),
    );
  }

  /**
   * replace the result if currently ok, or does nothing if err or promise rejected.
   * @param replace
   */
  and<U, EU = E>(replace: Result<U, EU>): AsyncResult<U, E | EU> {
    return new AsyncResult<U, E | EU>(this.promise.then((r) => r.and(replace)));
  }

  /**
   * replace the result if currently err, or does nothing if ok or promise rejected.
   * @param replace
   */
  or<EU = E>(replace: Result<T, EU>): AsyncResult<T, EU> {
    return new AsyncResult<T, EU>(this.promise.then((r) => r.or(replace)));
  }

  /**
   * returns a Promise of inner value if ok.
   * Keep in mind it may returns a rejected Promise if err.
   */
  unwrap(): Promise<T> {
    return this.promise.then((r) => r.unwrap());
  }

  /**
   * returns a Promise of inner error if err.
   * Keep in mind it may returns a rejected Promise if ok.
   */
  unwrapErr(): Promise<E> {
    return this.promise.then((r) => r.unwrapErr());
  }

  /**
   * returns a Promise of inner value, or given alternate value if err
   * @param alternate value
   */
  unwrapOr(alternate: T): Promise<T> {
    return this.promise.then((r) => r.unwrapOr(alternate));
  }

  /**
   * returns a Promise of inner value, or evaluate given function if err
   * @param alter
   */
  unwrapOrElse(alter: (error: E) => T): Promise<T> {
    return this.promise.then((r) => r.unwrapOrElse(alter));
  }

  /**
   * evaluates given ok or err function, corresponding to current status.
   * It does nothing if promise rejected.
   * @param matcher
   */
  match<U>(matcher: ResultMatcher<T, E, U>): Promise<U> {
    return this.promise.then((r) => r.match(matcher));
  }

  /**
   * just begin a failable asynchronous process.
   */
  static begin(): AsyncResult<void, never> {
    return new AsyncResult<void, never>(Promise.resolve(ok()));
  }

  /**
   * converts the exception into AsyncResult if given function throws.
   * @param f
   */
  static challenge<T>(f: () => Promise<T>): AsyncResult<T, unknown> {
    const promise = (async () => {
      try {
        return ok(await f());
      } catch (e) {
        return err(e);
      }
    })();
    return new AsyncResult(promise);
  }
}
