import { AsyncOption } from 'src/async-option';

interface OptionMatcher<T, R> {
  some: (value: T) => R;
  none: () => R;
}

interface OptionBase<T> {
  /**
   * currently some or not
   */
  isSome: boolean;
  /**
   * currently false or not
   */
  isNone: boolean;

  [Symbol.iterator](): Iterator<T>;

  /**
   * returns the inner value if some, otherwise throws
   */
  unwrap(): T;

  /**
   * returns the inner value if some, otherwise the given alternate
   * @param alternate
   */
  unwrapOr(alternate: T): T;

  /**
   * returns the inner value if some, otherwise the result of given function
   * @param alter
   */
  unwrapOrElse(alter: () => T): T;

  /**
   * returns the result of the matcher function corresponding to current inner value
   * @param matcher
   */
  match<R>(matcher: OptionMatcher<T, R>): R;

  /**
   * returns true if some and the inner value matches the predicate,
   * otherwise false
   * @param predicate
   */
  test(predicate: (value: T) => boolean): boolean;

  /**
   * returns some with a transformed value if some, otherwise none
   * @param transform
   */
  map<U>(transform: (value: T) => U): Option<U>;

  /**
   * returns a new option created by given function with inner value if some,
   * otherwise none
   * @param transform
   */
  andThen<U>(transform: (value: T) => Option<U>): Option<U>;

  /**
   * returns some if currently some and the inner value matches the predicate,
   * otherwise none
   * @param predicate
   */
  filter(predicate: (value: T) => boolean): Option<T>;

  /**
   * returns this if some,
   * otherwise a new some with given alternate value
   * @param alternate
   */
  insert<U = T>(alternate: U): Some<T | U>;

  /**
   * returns this if some,
   * otherwise a new some with the result of given function
   * @param alter
   */
  insertWith<U = T>(alter: () => U): Some<T | U>;

  /**
   * returns given replace option if some,
   * otherwise none
   * @param replace
   */
  and<U>(replace: Option<U>): Option<U>;

  /**
   * returns this if some,
   * otherwise given alternate option
   * @param alternate
   */
  or<U = T>(alternate: Option<U>): Option<U | T>;

  /**
   * returns this if this is some and the other is none,
   * or the other if this is none and the other is some,
   * otherwise none
   * @param other
   */
  xor<U = T>(other: Option<U>): Option<U | T>;

  /**
   * returns this if some,
   * otherwise a new option with the result of the given function
   * @param alter
   */
  orElse<U = T>(alter: () => Option<U>): Option<T | U>;

  /**
   * returns a new some with tuple of inner values if both this and the other are some,
   * otherwise none
   * @param other
   */
  zip<U>(other: Option<U>): Option<[T, U]>;

  /**
   * returns a new some with the result of given function with inner values if both this and the other are some,
   * otherwise none
   * @param other
   * @param transform
   */
  zipWith<U, R>(
    other: Option<U>,
    transform: (self: T, other: U) => R,
  ): Option<R>;
}

interface PromiseOption<T> {
  /**
   * returns a Promise that resolves to inner value if some,
   * otherwise Promise resolves to the result of given function
   * @param alter
   */
  unwrapOrElseAsync<U = T>(alter: () => U | Promise<U>): Promise<T | U>;

  /**
   * returns a Promise that resolves to true if some and the inner value matches the predicate,
   * otherwise false
   * @param predicate
   */
  testAsync(
    predicate: (value: T) => boolean | Promise<boolean>,
  ): Promise<boolean>;

  /**
   * returns a Promise that resolves to some with a transformed value if some, otherwise none
   * use this to avoid getting Option<Promise<U>>
   * @param transform
   */
  mapAsync<U>(transform: (value: T) => U | Promise<U>): Promise<Option<U>>;

  /**
   * returns a Promise that resolves to new option created by given function with inner value if some,
   * otherwise none
   * use this to avoid getting Option<Promise<U>>
   * @param transform
   */
  andThenAsync<U>(
    transform: (value: T) => Option<U> | Promise<Option<U>>,
  ): Promise<Option<U>>;

  /**
   * returns some if currently some and the inner value matches the predicate,
   * otherwise none
   * @param predicate
   */
  filterAsync(
    predicate: (value: T) => boolean | Promise<boolean>,
  ): Promise<Option<T>>;

  /**
   * returns this if some,
   * otherwise a new some with the result of given function
   * @param alter
   */
  insertWithAsync<U = T>(alter: () => U | Promise<U>): Promise<Option<T | U>>;

  /**
   * returns a Promise resolves to this if some,
   * otherwise a Promise resolves to a new option with the result of the given function
   * @param alter
   */
  orElseAsync<U = T>(
    alter: () => Option<U> | Promise<Option<U>>,
  ): Promise<Option<T | U>>;

  /**
   * returns a Promise resolves to a new some with the result of given function with inner values if both this and the other are some,
   * otherwise a Promise resolves to none
   * @param other
   * @param transform
   */
  zipWithAsync<U, R>(
    other: Option<U>,
    transform: (self: T, other: U) => R | Promise<R>,
  ): Promise<Option<R>>;

  /**
   * returns an async option contains a Promise that resolves to this
   */
  toAsync(): AsyncOption<T>;
}

export type Option<T> = Some<T> | None<T>;
export type { Some, None };
class Some<T> implements OptionBase<T>, PromiseOption<T> {
  isSome: true = true;
  isNone: false = false;
  *[Symbol.iterator](): Iterator<T> {
    yield this.value;
  }
  constructor(readonly value: T) {}
  unwrap(): T {
    return this.value;
  }
  unwrapOr(alternate: T): T {
    return this.value;
  }
  unwrapOrElse(alter: () => T): T {
    return this.value;
  }
  match<R>(matcher: OptionMatcher<T, R>): R {
    return matcher.some(this.value);
  }
  test(predicate: (value: T) => boolean): boolean {
    return predicate(this.value);
  }
  map<U>(transform: (value: T) => U): Some<U> {
    return some(transform(this.value));
  }
  andThen<U>(transform: (value: T) => Option<U>): Option<U> {
    return transform(this.value);
  }
  filter(predicate: (value: T) => boolean): Option<T> {
    return predicate(this.value) ? this : none_;
  }
  insert<U = T>(alternate: U): Some<T> {
    return this;
  }
  insertWith<U = T>(alter: () => U): Some<T> {
    return this;
  }
  and<U>(replace: Option<U>): Option<U> {
    return replace;
  }
  or<U = T>(alternate: Option<U>): Some<T> {
    return this;
  }
  xor<U = T>(other: Option<U>): Option<U | T> {
    if (other.isNone) {
      return this;
    }
    return none_;
  }
  orElse<U = T>(alter: () => Option<U>): Some<T> {
    return this;
  }
  zip<U>(other: Option<U>): Option<[T, U]> {
    return other.map((other) => [this.value, other]);
  }
  zipWith<U, R>(
    other: Option<U>,
    transform: (self: T, other: U) => R,
  ): Option<R> {
    return other.map((other) => transform(this.value, other));
  }

  async unwrapOrElseAsync<U = T>(alter: () => Promise<U> | U): Promise<T> {
    return this.value;
  }
  async testAsync(
    predicate: (value: T) => boolean | Promise<boolean>,
  ): Promise<boolean> {
    return predicate(this.value);
  }
  async mapAsync<U>(transform: (value: T) => Promise<U> | U): Promise<Some<U>> {
    return some(await transform(this.value));
  }
  async andThenAsync<U>(
    transform: (value: T) => Option<U> | Promise<Option<U>>,
  ): Promise<Option<U>> {
    return transform(this.value);
  }
  async insertWithAsync<U = T>(alter: () => Promise<U> | U): Promise<Some<T>> {
    return this;
  }
  async orElseAsync<U = T>(
    alter: () => Option<U> | Promise<Option<U>>,
  ): Promise<Some<T>> {
    return this;
  }

  async zipWithAsync<U, R>(
    other: Option<U>,
    transform: (self: T, other: U) => Promise<R> | R,
  ): Promise<Option<R>> {
    if (other.isNone) {
      return none_;
    }
    return some(await transform(this.value, other.value));
  }

  toAsync(): AsyncOption<T> {
    return new AsyncOption(Promise.resolve(this));
  }
}

class None<T = never> implements OptionBase<T>, PromiseOption<T> {
  never(): None {
    return none_;
  }

  isSome: false = false;
  isNone: true = true;

  *[Symbol.iterator](): Iterator<T> {}

  unwrap(): never {
    throw new Error('Cannot unwrap None');
  }
  unwrapOr(alternate: T): T {
    return alternate;
  }
  unwrapOrElse(alter: () => T): T {
    return alter();
  }
  match<R>(matcher: OptionMatcher<T, R>): R {
    return matcher.none();
  }
  test(predicate: (value: T) => boolean): false {
    return false;
  }
  map<U>(transform: (value: T) => U): None<U> {
    return none_;
  }
  andThen<U>(transform: (value: T) => Option<U>): None<U> {
    return none_;
  }
  filter(predicate: (value: T) => boolean): None<T> {
    return none_;
  }
  insert<U = T>(alternate: U): Some<U> {
    return some(alternate);
  }
  insertWith<U = T>(alter: () => U): Some<U> {
    return some(alter());
  }
  and<U>(replace: Option<U>): None<U> {
    return none_;
  }
  or<U = T>(alternate: Option<U>): Option<U> {
    return alternate;
  }
  xor<U = T>(other: Option<U>): Option<U | T> {
    if (other.isSome) {
      return other;
    }
    return none_;
  }
  orElse<U = T>(alter: () => Option<U>): Option<U> {
    return alter();
  }
  zip<U>(other: Option<U>): None<[T, U]> {
    return none_;
  }
  zipWith<U, R>(
    other: Option<U>,
    transform: (self: T, other: U) => R,
  ): Option<R> {
    return none_;
  }

  async unwrapOrElseAsync<U = T>(alter: () => Promise<U> | U): Promise<U> {
    return alter();
  }
  async testAsync(
    predicate: (value: T) => boolean | Promise<boolean>,
  ): Promise<false> {
    return false;
  }
  async mapAsync<U>(transform: (value: T) => Promise<U> | U): Promise<None<U>> {
    return none_;
  }
  async andThenAsync<U>(
    transform: (value: T) => Option<U> | Promise<Option<U>>,
  ): Promise<None<U>> {
    return none_;
  }
  async insertWithAsync<U = T>(alter: () => Promise<U> | U): Promise<Some<U>> {
    return some(await alter());
  }
  async orElseAsync<U = T>(
    alter: () => Option<U> | Promise<Option<U>>,
  ): Promise<Option<T | U>> {
    return alter();
  }
  async zipWithAsync<U, R>(
    other: Option<U>,
    transform: (self: T, other: U) => Promise<R> | R,
  ): Promise<None<R>> {
    return none_;
  }

  toAsync(): AsyncOption<T> {
    return new AsyncOption(Promise.resolve(this));
  }
}

/**
 * returns a value wrapped by Some<T>
 * @param value
 */
export function some<T>(value: T): Some<T> {
  return new Some(value);
}

const none_ = new None();

/**
 * Returns the unique instance of None
 */
export function none<T = never>(): None<T> {
  return none_;
}
