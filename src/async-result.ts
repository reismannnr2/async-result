import { err, Err, ok, Ok, Result, ResultMatcher } from './result';
import { AsyncOption } from 'src/async-option';
import { Option } from 'src/option';

export class AsyncResult<T, E> {
  constructor(readonly promise: Promise<Result<T, E> | Ok<T, E> | Err<E, T>>) {}
  private asyncRs<U, EU>(
    f: (r: Result<T, E>) => Promise<Result<U, EU>>,
  ): AsyncResult<U, EU> {
    return new AsyncResult<U, EU>((async () => f(await this.promise))());
  }

  /**
   * just returns inner promise
   */
  toPromise(): Result<T, E> {
    return this.promise as unknown as Result<T, E>;
  }
  /**
   * returns a promise of inner successful value if ok,
   * otherwise rejected promise
   */
  async unwrap(): Promise<T> {
    return (await this.promise).unwrap();
  }
  /**
   * returns a promise of inner error value if err,
   * otherwise rejected promise
   */
  async unwrapErr(): Promise<E> {
    return (await this.promise).unwrapErr();
  }

  /**
   * returns a promise of inner successful value if ok,
   * otherwise given alternate value
   */
  async unwrapOr<U = T>(alternate: U | Promise<U>): Promise<T | U> {
    return (await this.promise).unwrapOrElse(async () => await alternate);
  }
  /**
   * returns a promise of inner successful value if ok,
   * otherwise the result of given alter function
   */
  async unwrapOrElse<U = T>(
    alter: (error: E) => U | Promise<U>,
  ): Promise<T | U> {
    return (await this.promise).unwrapOrElse(alter);
  }
  /**
   * returns a promise of result from the matcher function corresponding to current state
   * calls ok if ok, err if err
   * @param matcher
   */
  async match<R>(matcher: ResultMatcher<T, E, R>): Promise<R> {
    return (await this.promise).match(matcher);
  }
  /**
   * returns inner value transformed Ok if ok,
   * otherwise just current Err<E>
   * @param transform
   */
  map<U>(transform: (value: T) => U | Promise<U>): AsyncResult<U, E> {
    return this.asyncRs((r) => r.mapAsync(transform));
  }
  /**
   * returns just current Ok<T> if ok,
   * otherwise inner error transformed Err
   * @param transform
   */
  mapErr<EU>(transform: (error: E) => EU | Promise<EU>): AsyncResult<T, EU> {
    return this.asyncRs((r) => r.mapErrAsync(transform));
  }
  /**
   * returns a new result created by given function with inner value if ok,
   * otherwise just current Err
   * @param transform
   */
  andThen<U, EU = E>(
    transform: (value: T) => Result<U, EU> | Promise<Result<U, EU>>,
  ): AsyncResult<U, E | EU> {
    return this.asyncRs((r) => r.andThenAsync(transform));
  }
  /**
   * returns just current Ok<T> if ok
   * otherwise a new result created by given function with inner value if some,
   * @param transform
   */
  orElse<EU, U = T>(
    transform: (error: E) => Result<U, EU> | Promise<Result<U, EU>>,
  ): AsyncResult<T | U, EU> {
    return this.asyncRs<T | U, EU>((r) => r.orElseAsync(transform));
  }
  /**
   * returns given replace result if ok,
   * otherwise just current Err
   * @param replace
   */
  and<U, EU = E>(
    replace: Result<U, EU> | Promise<Result<U, EU>>,
  ): AsyncResult<U, E | EU> {
    return this.asyncRs<U, E | EU>(async (r) => r.and(await replace));
  }
  /**
   * returns just current Ok if ok,
   * otherwise given alternate result
   * @param alternate
   */
  or<EU, U = T>(
    alternate: Result<U, EU> | Promise<Result<U, EU>>,
  ): AsyncResult<T | U, EU> {
    return this.asyncRs<T | U, EU>(async (r) => r.or(await alternate));
  }

  /**
   * call given function and returns the result of it if ok,
   * otherwise just current Err,
   * returns Err<unknown> if it throws
   * @param f
   */
  try<U>(
    f: (value: T) => Result<U, unknown> | Promise<Result<U, unknown>>,
  ): AsyncResult<U, unknown> {
    return this.asyncRs(async (r) => r.tryAsync(f));
  }

  /**
   * returns the result of predicate if ok,
   * otherwise just false
   * both wrapped in promise
   * @param predicate
   */
  async test(
    predicate: (value: T) => boolean | Promise<boolean>,
  ): Promise<boolean> {
    return (await this.promise).testAsync(predicate);
  }

  /**
   * returns a promise of Some<T> with inner value if ok,
   * otherwise None, discards error
   */
  async toOptionPromise(): Promise<Option<T>> {
    return (await this.promise).toOption();
  }

  /**
   * returns an AsyncOption<T>, contains inner value if Ok,
   * otherwise AsyncOption<T> which is None, discards error
   */
  toAsyncOption(): AsyncOption<T> {
    return new AsyncOption<T>(this.toOptionPromise());
  }

  /**
   * starts asynchronous failable process
   */
  static begin(): AsyncResult<void, never> {
    return ok().toAsync();
  }

  /**
   * return the result of given function wrap in Ok<T> if succeeded,
   * wrap error in Err<E> if thrown.
   * E type is optional and not checked, since exception type cannot be inferred.
   * Both are wrapped in AsyncResult
   * @param f
   */
  static try<T>(f: () => T | Promise<T>): AsyncResult<T, unknown> {
    return new AsyncResult<T, unknown>(
      (async () => {
        try {
          return ok(await f());
        } catch (e) {
          return err(e);
        }
      })(),
    );
  }
}
