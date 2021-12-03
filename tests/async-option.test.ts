import { none, some } from '../src/option';

describe('AsyncOption<T>', () => {
  const op = some(10).toAsync();
  const anon = none<number>().toAsync();
  test('should just return promised result for consumers', async () => {
    expect(await op.unwrap()).toBe(10);
    expect(await anon.unwrapOr(15)).toBe(15);
    expect(await op.unwrapOrElse(() => 20)).toBe(10);
    expect(
      await anon.match({ some: async (v) => v * 10, none: async () => 55 }),
    ).toBe(55);
  });
  test('just call inner option and wrap the result with AsyncOption', async () => {
    expect(await op.test(async (v) => v > 20)).toBe(false);
    expect((await op.map((v) => v * 2).toPromise()).unwrap()).toBe(20);
    expect((await op.andThen((v) => some(v * 3)).toPromise()).unwrap()).toBe(
      30,
    );
    expect(await op.filter((v) => v > 20).toPromise()).toBe(none());
    expect((await anon.insert(100).toPromise()).unwrap()).toBe(100);
    expect((await op.insertWith(() => 100).toPromise()).unwrap()).toBe(10);
    expect((await op.orElse(() => some(30)).toPromise()).unwrap()).toBe(10);
    expect(await anon.and(some(10)).toPromise()).toBe(none());
    expect((await op.or(none()).toPromise()).unwrap()).toBe(10);
    expect(await op.xor(some(20)).toPromise()).toBe(none());
  });
  test('can be converted into AsyncResult or Promise of Result', async () => {
    expect(await (await anon.toAsyncResult(() => 'error')).unwrapErr()).toBe(
      'error',
    );
    expect(await (await op.toAsyncResult(() => 'error')).unwrap()).toBe(10);
    expect((await op.toResultPromise(() => 'error')).unwrap()).toBe(10);
    expect((await anon.toResultPromise(() => 'error')).unwrapErr()).toBe(
      'error',
    );
  });
});
