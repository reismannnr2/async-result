import { ok, err } from '../src/result';
import { none } from '../src/option';
import { AsyncResult } from '../src/async-result';

describe('AsyncResult<T,E>', () => {
  const rOk = AsyncResult.begin().andThen<number, string>(() => ok(10));
  const rErr = err<string, number>('error').toAsync();
  test('toPromise() just returns inner promise', async () => {
    expect((await rOk.toPromise()).unwrap()).toBe(10);
  });
  test('should return just promised result for consumers', async () => {
    expect(await rOk.unwrap()).toBe(10);
    expect(await rErr.unwrapOr(100)).toBe(100);
    expect(await rErr.unwrapOrElse((error) => error.length)).toBe(5);
    expect(
      await rOk.match({
        ok: (v) => v + v,
        err: () => {
          throw 'error';
        },
      }),
    ).toBe(20);
    expect(await rErr.test(async () => true)).toBe(false);
  });
  test('just call inner result and wrap the result with AsyncResult', async () => {
    expect(await rOk.map(async (v) => v * v).unwrap()).toBe(100);
    expect(await rErr.mapErr((error) => error.substring(2)).unwrapErr()).toBe(
      'ror',
    );
    expect(await rErr.andThen(async (v) => ok(v.toString())).unwrapErr()).toBe(
      'error',
    );
    expect(await rOk.orElse((error) => ok(error.length)).unwrap()).toBe(10);
    expect((await rOk.and(ok(20).toAsync().promise).promise).unwrap()).toBe(20);
    expect((await rOk.or(ok(20).toAsync().promise).promise).unwrap()).toBe(10);
    const o = {};
    expect(
      await rOk
        .try(() => {
          throw o;
        })
        .unwrapErr(),
    ).toBe(o);
  });
  test('can be converted into option promise or async option', async () => {
    expect(await rErr.toOptionPromise()).toBe(none());
    expect(
      await rOk
        .toAsyncOption()
        .map((v) => v + 1)
        .unwrap(),
    ).toBe(11);
  });
  test('static try() and begin() can start asynchronous process', async () => {
    expect(
      await AsyncResult.begin()
        .map(() => 'v')
        .unwrap(),
    ).toBe('v');
    expect(await AsyncResult.try(() => 10).unwrap()).toBe(10);
    const o = {};
    expect(
      await AsyncResult.try(() => {
        throw o;
      }).unwrapErr(),
    ).toBe(o);
  });
});
