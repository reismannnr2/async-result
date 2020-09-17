import { err, ok, Result } from 'src/result';

describe('Result<T, E>', () => {
  test('static methods', () => {
    expect(
      Result.begin()
        .andThen((v) => ok(v))
        .unwrap(),
    ).toBe(undefined);
    expect(Result.challenge(() => 5).unwrap()).toBe(5);
    expect(
      Result.challenge(() => {
        throw new Error('message');
      }).unwrapErr(),
    ).toEqual(new Error('message'));
  });
  test('synchronous methods', () => {
    const rOk: Result<number, string> = ok(5);
    const rErr: Result<number, string> = err().mapErr(() => 'error');
    expect(rOk.isOk()).toBe(true);
    expect(rOk.isErr()).toBe(false);
    expect(rErr.isOk()).toBe(false);
    expect(rErr.isErr()).toBe(true);
    expect(rOk.unwrap()).toBe(5);
    expect(() => rErr.unwrap()).toThrow();
    expect(() => rOk.unwrapErr()).toThrow();
    expect(rErr.unwrapErr()).toBe('error');
    expect(rOk.unwrapOr(10)).toBe(5);
    expect(rErr.unwrapOr(10)).toBe(10);
    expect(rOk.unwrapOrElse(() => 10)).toBe(5);
    expect(rErr.unwrapOrElse(() => 10)).toBe(10);
    expect(rOk.match({ ok: (value) => value * 3, err: (s) => s.length })).toBe(
      15,
    );
    expect(rErr.match({ ok: (value) => value * 3, err: (s) => s.length })).toBe(
      5,
    );
    expect(rOk.map((v) => v * 2).unwrap()).toBe(10);
    expect(rErr.map((v) => v * 2).unwrapErr()).toBe('error');
    expect(rOk.mapErr((v) => v).unwrap()).toBe(5);
    expect(rErr.mapErr((e) => e.length).unwrapErr()).toBe(5);
    expect(rOk.andThen((v) => ok(v * 2)).unwrap()).toBe(10);
    expect(rErr.andThen((v) => ok(v * 2)).unwrapErr()).toBe('error');
    expect(rOk.orElse((error) => ok(error.length * 3)).unwrap()).toBe(5);
    expect(rErr.orElse((error) => ok(error.length * 3)).unwrap()).toBe(15);
    expect(rOk.and(ok(10)).unwrap()).toBe(10);
    expect(rErr.and(ok(10)).unwrapErr()).toBe('error');
    expect(rOk.or(ok(10)).unwrap()).toBe(5);
    expect(rErr.or(ok(10)).unwrap()).toBe(10);
  });
  test('asynchronous methods', async () => {
    const rOk: Result<number, string> = ok(5);
    const rErr: Result<number, string> = err('error');
    expect((await rOk.mapAsync(async (v) => v * 2)).unwrap()).toEqual(10);
    expect((await rErr.mapAsync(async (v) => v * 2)).unwrapErr()).toEqual(
      'error',
    );
    expect((await rOk.mapErrAsync(async (v) => v.length * 2)).unwrap()).toEqual(
      5,
    );
    expect(
      (await rErr.mapErrAsync(async (v) => v.length * 2)).unwrapErr(),
    ).toEqual(10);
    expect((await rOk.andThenAsync(async (v) => ok(v * 2))).unwrap()).toEqual(
      10,
    );
    expect(
      (await rErr.andThenAsync(async (v) => ok(v * 2))).unwrapErr(),
    ).toEqual('error');
    expect(
      (await rOk.orElseAsync(async (e) => ok(e.length * 2))).unwrap(),
    ).toEqual(5);
    expect(
      (await rErr.orElseAsync(async (e) => ok(e.length * 2))).unwrap(),
    ).toEqual(10);
    expect((await rOk.toAsync().toPromise()).unwrap()).toBe(5);
  });
});
