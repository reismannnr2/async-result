import { Option } from './option';

/**
 * a class for treating optional value with same interface continuously.
 */
export class AsyncOption<T> {
  constructor(readonly promise: Promise<Option<T>>) {}
  map<U>(transform: (value: T) => U | Promise<U>): AsyncOption<U> {
    return asyncOp(async () => (await this.promise).mapAsync(transform));
  }
  andThen<U>(
    transform: (value: T) => Option<U> | Promise<Option<U>>,
  ): AsyncOption<U> {
    return asyncOp(async () => (await this.promise).andThenAsync(transform));
  }
}

function asyncOp<T>(f: () => Promise<Option<T>>): AsyncOption<T> {
  return new AsyncOption(f());
}
