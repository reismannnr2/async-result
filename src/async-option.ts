import { Option, OptionMatcher } from './option';
import { AsyncResult } from 'src/async-result';
import { Result } from 'src/result';

/**
 * a class for treating optional value with same interface continuously.
 * It does not have fooAsync instance method since all methods can work with promise.
 */
export class AsyncOption<T> {
  constructor(readonly promise: Promise<Option<T>>) {}

  /**
   * exposes inner promise value for convenience.
   */
  toPromise(): Promise<Option<T>> {
    return this.promise;
  }

  /**
   * returns the inner value promise if some, otherwise rejected promise
   */
  async unwrap(): Promise<T> {
    return (await this.promise).unwrap();
  }

  /**
   * returns the inner value promise if some, otherwise the given alternate
   * @param alternate
   */
  async unwrapOr<U = T>(alternate: U | Promise<U>): Promise<T | U> {
    return (await this.promise).unwrapOr(alternate);
  }

  /**
   * returns the inner value promise if some, otherwise the result of given function
   * @param alter
   */
  async unwrapOrElse<U = T>(alter: () => U | Promise<U>): Promise<T | U> {
    return (await this.promise).unwrapOrElse(alter);
  }

  /**
   * returns the result promise of the matcher function corresponding to current inner value
   * @param matcher
   */
  async match<R>(matcher: OptionMatcher<T, R>): Promise<R> {
    return (await this.promise).match(matcher);
  }

  /**
   * returns boolean promise, true if some and the inner value matches the predicate,
   * otherwise false
   * @param predicate
   */
  async test(
    predicate: (value: T) => boolean | Promise<boolean>,
  ): Promise<boolean> {
    return (await this.promise).testAsync(predicate);
  }

  private asyncOp<U = T>(
    f: (op: Option<T>) => Promise<Option<U>>,
  ): AsyncOption<U> {
    return new AsyncOption<U>((async () => f(await this.promise))());
  }

  /**
   * returns some promise with a transformed value if some, otherwise none
   * @param transform
   */
  map<U>(transform: (value: T) => U | Promise<U>): AsyncOption<U> {
    return this.asyncOp((op) => op.mapAsync(transform));
  }

  /**
   * returns a promise of new option created by given function with inner value if some,
   * otherwise none
   * @param transform
   */
  andThen<U>(
    transform: (value: T) => Option<U> | Promise<Option<U>>,
  ): AsyncOption<U> {
    return this.asyncOp((op) => op.andThenAsync(transform));
  }

  /**
   * returns some promise if currently some and the inner value matches the predicate,
   * otherwise none
   * @param predicate
   */
  filter(predicate: (value: T) => boolean | Promise<boolean>): AsyncOption<T> {
    return this.asyncOp((op) => op.filterAsync(predicate));
  }

  /**
   * returns resolved promise of this if some,
   * otherwise a new some promise with given alternate value
   * @param alternate
   */
  insert<U = T>(alternate: U | Promise<U>): AsyncOption<T | U> {
    return this.asyncOp(async (op) => op.insert(await alternate));
  }

  /**
   * returns resolved promise this if some,
   * otherwise a new some promise with the result of given function
   * @param alter
   */
  insertWith<U = T>(alter: () => U | Promise<U>): AsyncOption<T | U> {
    return this.asyncOp((op) => op.insertWithAsync(alter));
  }

  /**
   * returns resolved promise of this if some,
   * otherwise a new option with the result of the given function
   * @param alter
   */
  orElse<U = T>(
    alter: () => Option<U> | Promise<Option<U>>,
  ): AsyncOption<T | U> {
    return this.asyncOp((op) => op.orElseAsync(alter));
  }

  /**
   * returns a given replace promise option if some,
   * otherwise none
   * @param replace
   */
  and<U>(replace: Option<U> | Promise<Option<U>>): AsyncOption<U> {
    return this.asyncOp(async (op) => op.and(await replace));
  }

  /**
   * returns resolved promise of this if some,
   * otherwise given alternate option
   * @param alternate
   */
  or<U = T>(alternate: Option<U> | Promise<Option<U>>): AsyncOption<T | U> {
    return this.asyncOp(async (op) => op.or(await alternate));
  }

  /**
   * returns resolved promise of this if this is some and the other is none,
   * or the other if this is none and the other is some,
   * otherwise none
   * @param other
   */
  xor<U = T>(other: Option<U> | Promise<Option<U>>): AsyncOption<T | U> {
    return this.asyncOp(async (op) => op.xor(await other));
  }

  /**
   * returns AsyncResult<T, E> that contains inner value if ok,
   * otherwise error created by given function
   * @param onError
   */
  toAsyncResult<E>(onError: () => E | Promise<E>): AsyncResult<T, E> {
    return new AsyncResult<T, E>(
      (async () => (await this.promise).toResultAsync(onError))(),
    );
  }

  /**
   * returns Promise<Result<T, E>> that contains inner value if ok,
   * otherwise error created by given function
   * @param onError
   */
  async toResultPromise<E>(
    onError: () => E | Promise<E>,
  ): Promise<Result<T, E>> {
    return (await this.promise).toResultAsync(onError);
  }
}
