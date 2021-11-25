import { AsyncResult } from '../src/async-result';
import { ok, err } from '../src/result';

describe('AsyncResult<T, E>', () => {
  test('static methods', async () => {
    expect(
      (
        await AsyncResult.begin()
          .map(() => 5)
          .toPromise()
      ).unwrap(),
    ).toBe(5);
    expect((await AsyncResult.challenge(async () => 5).promise).unwrap()).toBe(
      5,
    );
    expect(
      (
        await AsyncResult.challenge(async () => {
          throw new Error('error');
        }).promise
      ).unwrapErr(),
    ).toEqual(new Error('error'));
  });
  test('all methods', async () => {
    const arOk: AsyncResult<number, string> = AsyncResult.begin().map(() => 5);
    const arErr: AsyncResult<number, string> = AsyncResult.begin().andThen(() =>
      err('error'),
    );
    expect(
      await arOk
        .map((v) => v * 2)
        .toPromise()
        .then((r) => r.unwrap()),
    ).toBe(10);
    expect(
      await arErr
        .map((v) => v * 2)
        .toPromise()
        .then((r) => r.unwrapErr()),
    ).toBe('error');
    expect(
      await arOk
        .mapAsync(async (v) => v * 2)
        .toPromise()
        .then((r) => r.unwrap()),
    ).toBe(10);
    expect(
      await arErr
        .mapAsync(async (v) => v * 2)
        .toPromise()
        .then((r) => r.unwrapErr()),
    ).toBe('error');

    expect(
      await arOk
        .mapErr((s) => s.length * 3)
        .toPromise()
        .then((r) => r.unwrap()),
    ).toBe(5);
    expect(
      await arErr
        .mapErr((s) => s.length * 3)
        .toPromise()
        .then((r) => r.unwrapErr()),
    ).toBe(15);

    expect(
      await arOk
        .mapErrAsync(async (s) => s.length * 3)
        .toPromise()
        .then((r) => r.unwrap()),
    ).toBe(5);
    expect(
      await arErr
        .mapErrAsync(async (s) => s.length * 3)
        .toPromise()
        .then((r) => r.unwrapErr()),
    ).toBe(15);

    expect(
      await arOk
        .andThen((v) => ok(v * 2))
        .toPromise()
        .then((r) => r.unwrap()),
    ).toBe(10);
    expect(
      await arErr
        .andThen((v) => ok(v * 2))
        .toPromise()
        .then((r) => r.unwrapErr()),
    ).toBe('error');

    expect(
      await arOk
        .andThenAsync(async (v) => ok(v * 2))
        .toPromise()
        .then((r) => r.unwrap()),
    ).toBe(10);
    expect(
      await arErr
        .andThenAsync(async (v) => ok(v * 2))
        .toPromise()
        .then((r) => r.unwrapErr()),
    ).toBe('error');

    expect(
      await arOk
        .orElse((s) => ok(s.length * 3))
        .toPromise()
        .then((r) => r.unwrap()),
    ).toBe(5);
    expect(
      await arErr
        .orElse((v) => ok(v.length * 3))
        .toPromise()
        .then((r) => r.unwrap()),
    ).toBe(15);

    expect(
      await arOk
        .orElseAsync(async (s) => ok(s.length * 3))
        .toPromise()
        .then((r) => r.unwrap()),
    ).toBe(5);
    expect(
      await arErr
        .orElseAsync(async (v) => ok(v.length * 3))
        .toPromise()
        .then((r) => r.unwrap()),
    ).toBe(15);
    expect(
      await arOk.match({
        ok: (value) => value * 2,
        err: (error) => error.length * 3,
      }),
    ).toBe(10);
    expect(
      await arErr.match({
        ok: (value) => value * 2,
        err: (error) => error.length * 3,
      }),
    ).toBe(15);
    expect(await arOk.unwrap()).toBe(5);
    expect(await arOk.unwrapOr(10)).toBe(5);
    expect(await arErr.unwrapOr(10)).toBe(10);
    expect(await arErr.unwrapErr()).toBe('error');
    expect(await arOk.unwrapOrElse((s) => s.length * 2)).toBe(5);
    expect(await arErr.unwrapOrElse((s) => s.length * 2)).toBe(10);
    expect(await arOk.and(err('error!')).unwrapErr()).toBe('error!');
    expect(await arErr.or(ok(100)).unwrap()).toBe(100);
  });
});
