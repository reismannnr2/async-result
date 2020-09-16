import { err, ok, Result, ResultMatcher } from 'src/result';

export class AsyncResult<T, E> {
  constructor(readonly promise: Promise<Result<T, E>>) {}
  toPromise(): Promise<Result<T, E>> {
    return this.promise;
  }
  map<U>(f: (value: T) => U): AsyncResult<U, E> {
    return new AsyncResult<U, E>(this.promise.then((r) => r.map(f)));
  }
  mapAsync<U>(f: (value: T) => Promise<U>): AsyncResult<U, E> {
    return new AsyncResult<U, E>(this.promise.then((r) => r.mapAsync(f)));
  }

  mapErr<EU>(f: (error: E) => EU): AsyncResult<T, EU> {
    return new AsyncResult<T, EU>(this.promise.then((r) => r.mapErr(f)));
  }
  mapErrAsync<EU>(f: (error: E) => Promise<EU>): AsyncResult<T, EU> {
    return new AsyncResult<T, EU>(this.promise.then((r) => r.mapErrAsync(f)));
  }

  andThen<U, EU = E>(f: (value: T) => Result<U, EU>): AsyncResult<U, E | EU> {
    return new AsyncResult<U, E | EU>(this.promise.then((r) => r.andThen(f)));
  }
  andThenAsync<U, EU = E>(
    f: (value: T) => Promise<Result<U, EU>>,
  ): AsyncResult<U, E | EU> {
    return new AsyncResult<U, E | EU>(
      this.promise.then((r) => r.andThenAsync(f)),
    );
  }
  orElse<EU = E>(f: (error: E) => Result<T, EU>): AsyncResult<T, EU> {
    return new AsyncResult<T, EU>(this.promise.then((r) => r.orElse(f)));
  }
  orElseAsync<EU = E>(
    f: (error: E) => Promise<Result<T, E | EU>>,
  ): AsyncResult<T, E | EU> {
    return new AsyncResult<T, E | EU>(
      this.promise.then((r) => r.orElseAsync(f)),
    );
  }

  async match<U>(matcher: ResultMatcher<T, E, U>): Promise<U> {
    return this.promise.then((r) => r.match(matcher));
  }

  static begin(): AsyncResult<void, never> {
    return new AsyncResult<void, never>(Promise.resolve(ok()));
  }
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
