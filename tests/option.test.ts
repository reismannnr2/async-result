import { none, some } from '../src/option';

describe('Option<T>', () => {
  describe('Some<T>', () => {
    const raw = { v: 6 };
    const op = some(raw);
    test('can return just inner value', async () => {
      const mock = jest.fn(() => ({ v: 10 }));
      expect(op.unwrap()).toBe(raw);
      expect(op.unwrapOr({})).toBe(raw);
      expect(op.unwrapOrElse(mock)).toBe(raw);
      expect(mock).not.toHaveBeenCalled();
    });
    test('match() should call some pattern with inner value', () => {
      const mock = jest.fn((v: { v: number }) => v.v * 2);
      const dummy = jest.fn(() => 30);
      expect(op.match({ some: mock, none: dummy })).toBe(12);
      expect(dummy).not.toHaveBeenCalled();
    });
    test('test() and testAsync() should return result of predicate', async () => {
      expect(op.test(({ v }) => v > 0)).toBe(true);
      expect(op.test(({ v }) => v < 0)).toBe(false);
      expect(await op.testAsync(async ({ v }) => v > 0)).toBe(true);
      expect(await op.testAsync(async ({ v }) => v < 0)).toBe(false);
    });
    test('map() and mapAsync() should convert inner value', async () => {
      const transformed = op.map(({ v }) => ({
        v: v + 10,
      }));
      expect(transformed.value).toEqual({ v: 16 });
      expect(transformed).not.toBe(op);
      expect(transformed.value).not.toBe(op.value);
      const transformedAsync = await op.mapAsync(async ({ v }) => ({
        v: v + 10,
      }));
      expect(transformedAsync.value).toEqual({ v: 16 });
      expect(transformedAsync).not.toBe(op);
      expect(transformedAsync.value).not.toBe(op.value);
    });
    test('andThen() and andThenAsync should return just result of given function', async () => {
      const mock = jest.fn(({ v }: { v: number }) => {
        return some({ v: v + 20 });
      });
      const transformed = op.andThen(mock);
      expect(mock).toHaveBeenLastCalledWith(raw);
      expect(mock).toHaveLastReturnedWith(transformed);
      const mockAsync = jest.fn(async ({ v }: { v: number }) => {
        return some({ v: v + 20 });
      });
      const transformedAsync = await op.andThenAsync(mockAsync);
      expect(mock).toHaveBeenLastCalledWith(raw);
      expect(mock).toHaveLastReturnedWith(transformedAsync);
    });
    test('filter() and filterAsync() should filter inner value and return none if false', async () => {
      expect(op.filter(({ v }) => v > 0)).toBe(op);
      expect(op.filter(({ v }) => v < 0)).toBe(none());
      expect(await op.filterAsync(async ({ v }) => v > 0)).toBe(op);
      expect(await op.filterAsync(async ({ v }) => v < 0)).toBe(none());
    });
    test('and() should return given value', () => {
      expect(op.and(none())).toBe(none());
    });
    test('xor() should return some-side only if only one of either is some', () => {
      expect(op.xor(none())).toBe(op);
      expect(op.xor(some({ v: 10 }))).toBe(none());
    });
    test('should return just itself for do-if-none methods', async () => {
      expect(op.insert(undefined)).toBe(op);
      expect(op.insertWith(() => undefined)).toBe(op);
      expect(await op.insertWithAsync(async () => undefined)).toBe(op);
      expect(op.or(none())).toBe(op);
      expect(op.orElse(() => none())).toBe(op);
      expect(await op.orElseAsync(() => none())).toBe(op);
    });
    test('zip() should return option with tuple of two some-s if both are some', () => {
      const other = some(10);
      const zipped = op.zip(other);
      expect(zipped.unwrap()).toEqual([{ v: 6 }, 10]);
      expect(op.zip(none())).toBe(none());
    });
    test('zipWith() and zipWithAsync() should zip inner values with given function if both are some', async () => {
      const other = some(10);
      const zipped = op.zipWith(other, ({ v }, other) => v + other);
      expect(zipped.unwrap()).toBe(16);
      expect(op.zipWith(none<number>(), ({ v }, other) => v + other)).toBe(
        none(),
      );

      expect(
        (
          await op.zipWithAsync(other, async ({ v }, other) => v + other)
        ).unwrap(),
      ).toBe(16);
      expect(
        await op.zipWithAsync(none<number>(), ({ v }, other) => v + other),
      ).toBe(none());
    });
    test('toAsync() just return wrapped option', async () => {
      const asyncOp = op.toAsync();
      expect(await asyncOp.promise).toBe(op);
    });
    test('can iterate inner value', () => {
      const mock = jest.fn();
      for (const inner of op) {
        expect(inner).toBe(raw);
        mock();
      }
      expect(mock).toHaveBeenCalledTimes(1);
    });
    test('toResult() should return Promise of Ok', async () => {
      expect(op.toResult(() => 'error').unwrap()).toEqual({
        v: 6,
      });
    });
    test('toResultAsync() should return Promise of Ok', async () => {
      expect((await op.toResultAsync(() => 'error')).unwrap()).toEqual({
        v: 6,
      });
    });
  });
});

describe('None', () => {
  test('never() should return just itself', () => {
    expect(none().never()).toBe(none());
  });
  test('throw if unwrapped', () => {
    expect(() => none().unwrap()).toThrow();
  });
  test('unwrapOr /-Else should return (result of) given value/function instead of inner', () => {
    expect(none().unwrapOr(10)).toBe(10);
    expect(none().unwrapOrElse(() => 15)).toBe(15);
  });
  test('match() should call none side and return it', () => {
    expect(none<number>().match({ some: (v) => v * 10, none: () => 15 })).toBe(
      15,
    );
  });
  test('orElse() and -Async() should return just result of given function', async () => {
    const op = some(10);
    expect(none().orElse(() => op)).toBe(op);
    expect(await none().orElseAsync(async () => op)).toBe(op);
  });
  test('should return just itself for do-if-some methods', async () => {
    expect(none().map(() => 10)).toBe(none());
    expect(await none().mapAsync(async () => 10)).toBe(none());
    expect(none().andThen(() => some(10))).toBe(none());
    expect(await none().andThenAsync(async () => some(10))).toBe(none());
    expect(none().filter(() => true)).toBe(none());
    expect(await none().filterAsync(async () => true)).toBe(none());
    expect(none().and(some(10))).toBe(none());
    expect(none().zip(some(10))).toBe(none());
    expect(none().zipWith(some(10), () => 100)).toBe(none());
    expect(await none().zipWithAsync(some(10), () => 1000)).toBe(none());
  });
  test('test() and -Async() should return false', async () => {
    expect(none().test(() => true)).toBe(false);
    expect(await none().testAsync(async () => true)).toBe(false);
  });
  test('toAsync() just return wrapped option', async () => {
    const asyncOp = none().toAsync();
    expect(await asyncOp.promise).toBe(none());
  });
  test('insert() return some-wrapped value', () => {
    expect(none().insert(10).unwrap()).toBe(10);
  });
  test('insertWith() and -Async() should return some-wrapped value of given function', async () => {
    expect(
      none()
        .insertWith(() => 10)
        .unwrap(),
    ).toBe(10);
    expect((await none().insertWithAsync(async () => 15)).unwrap()).toBe(15);
  });
  test('or() should return just given value', () => {
    const op = some(10);
    expect(none().or(op)).toBe(op);
  });
  test('xor() should return just given value', () => {
    const op = some(10);
    expect(none().xor(op)).toBe(op);
    expect(none().xor(none())).toBe(none());
  });
  test('toAsync() just return wrapped option', async () => {
    const asyncOp = none().toAsync();
    expect(await asyncOp.promise).toBe(none());
  });
  test('can iterate inner value', () => {
    const mock = jest.fn();
    for (const inner of none()) {
      mock();
    }
    expect(mock).toHaveBeenCalledTimes(0);
  });
  test('toResult() should return Promise of Err', async () => {
    expect(
      none()
        .toResult(() => 'error')
        .unwrapErr(),
    ).toBe('error');
  });
  test('toResultAsync() should return Promise of Err', async () => {
    expect((await none().toResultAsync(() => 'error')).unwrapErr()).toBe(
      'error',
    );
  });
});
