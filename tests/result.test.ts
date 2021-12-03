import { err, ok, Result } from '../src/result';
import { none } from '../src/option';

describe('Result<T, E>', () => {
  describe('Ok<T>', () => {
    const r = ok<number, string>(10);
    test('can iterate', () => {
      const mock = jest.fn();
      for (const v of r) {
        expect(v).toBe(10);
        mock();
      }
      expect(mock).toHaveBeenCalledTimes(1);
    });
    test('can unwrap but cannot unwrapErr', () => {
      expect(r.unwrap()).toBe(10);
      expect(r.unwrapOr(100)).toBe(10);
      expect(r.unwrapOrElse(() => NaN)).toBe(10);
      expect(() => r.unwrapErr()).toThrow();
    });
    test('match() should call ok pattern with inner value', () => {
      expect(r.match({ ok: (v) => v.toString(), err: (error) => error })).toBe(
        '10',
      );
    });
    test('map() and mapAsync should transform inner value', async () => {
      const transformed = r.map((v) => v * 2);
      expect(transformed.unwrap()).toBe(20);
      expect(r.unwrap()).toBe(10);
      const transformedAsync = r.mapAsync(async (v) => v * 2);
      expect((await transformedAsync).unwrap()).toBe(20);
      expect(r.unwrap()).toBe(10);
    });
    test('andThen() and andThenAsync() should transform with inner value', async () => {
      const transformed = r.andThen((v) => ok(v * 10));
      expect(transformed.isOk && transformed.unwrap()).toBe(100);
      const transformedAsync = await r.andThenAsync(async (v) => ok(v * 10));
      expect(transformedAsync.isOk && transformedAsync.unwrap()).toBe(100);
    });
    test('test() and testAsync() should call predicate and return result of it', async () => {
      expect(r.test((v) => v > 0)).toBe(true);
      expect(await r.testAsync((v) => v < 0)).toBe(false);
    });
    test('toOption() should return Some with inner value', () => {
      const op = r.toOption();
      expect(op.isSome && op.unwrap()).toBe(10);
    });
    test('try() and tryAsync should return result of given function, or Err<unknown> if thrown', async () => {
      const o = {};
      expect(r.try((v) => ok(v * 10)).unwrap()).toBe(100);
      const failed = r.try(() => {
        throw o;
      });
      expect(failed.isErr && failed.unwrapErr()).toBe(o);
      expect((await r.tryAsync(async (v) => ok(v * 10))).unwrap()).toBe(100);
      const failedAsync = await r.tryAsync(async () => {
        throw o;
      });
      expect(failedAsync.isErr && failedAsync.unwrapErr()).toBe(o);
    });
    test('and() should return just given value', () => {
      const rep = err('s');
      expect(r.and(rep)).toBe(rep);
    });
    test('should return just itself for do-if-err functions', async () => {
      expect(r.mapErr((e) => Number(e))).toBe(r);
      expect(await r.mapErrAsync(async (e) => Number(e))).toBe(r);
      expect(r.orElse((e) => ok(Number(e)))).toBe(r);
      expect(await r.orElseAsync(async (e) => ok(Number(e)))).toBe(r);
      expect(r.or(err('foo'))).toBe(r);
    });
    test('toAsync() should return asynchronous version', async () => {
      expect(await r.toAsync().unwrap()).toBe(10);
    });
    test('always() returns itself', () => {
      expect(r.always()).toBe(r);
    });
  });
  describe('Err<E>', () => {
    const r = err<string, number>('error');
    test('can iterate but nothing happen', () => {
      const mock = jest.fn();
      for (const _ of r) {
        mock();
      }
      expect(mock).not.toHaveBeenCalled();
    });
    test('cannot unwrap', () => {
      expect(() => r.unwrap()).toThrow();
    });
    test('can unwrapErr()', () => {
      expect(r.unwrapErr()).toBe('error');
    });
    test('can unwrap with alternate', () => {
      expect(r.unwrapOr(10)).toBe(10);
      expect(r.unwrapOrElse((e) => e.length)).toBe(5);
    });
    test('match() should call err pattern and return result of it', () => {
      expect(
        r.match({
          ok: () => {
            throw new Error('never reach');
          },
          err: (error) => error.length,
        }),
      ).toBe(5);
    });
    test('should return itself for do-if-ok methods', async () => {
      expect(r.map((v) => v * 2)).toBe(r);
      expect(await r.mapAsync((v) => v * 2)).toBe(r);
      expect(r.andThen((v) => ok(v * 2))).toBe(r);
      expect(await r.andThenAsync((v) => ok(v * 2))).toBe(r);
      expect(r.try((v) => ok(v * 2))).toBe(r);
      expect(await r.tryAsync((v) => ok(v * 2))).toBe(r);
      expect(r.and(ok(6))).toBe(r);
    });
    test('mapErr() and mapErrAsync() should transform inner error', async () => {
      expect(r.mapErr((error) => error + '-' + error).unwrapErr()).toBe(
        'error-error',
      );
      expect(
        (await r.mapErrAsync(async (error) => error + '-' + error)).unwrapErr(),
      ).toBe('error-error');
    });
    test('orElse() and orElseAsync() returns result of given function', async () => {
      expect(r.orElse((error) => ok(error.length)).unwrap()).toBe(5);
      expect(
        (await r.orElseAsync(async (error) => ok(error.length))).unwrap(),
      ).toBe(5);
    });
    test('or() returns just given value', () => {
      expect(r.or(err('foo')).unwrapErr()).toBe('foo');
    });
    test('test() and testAsync() returns always false', async () => {
      expect(r.test(() => true)).toBe(false);
      expect(await r.testAsync(async () => true)).toBe(false);
    });
    test('toOption() returns just none', () => {
      expect(r.toOption()).toBe(none());
    });
    test('toAsync() should return asynchronous version', async () => {
      expect(
        (
          await r.toAsync().mapErr(async (error) => error.substring(2)).promise
        ).unwrapErr(),
      ).toBe('ror');
    });
    test('never() returns just itself', () => {
      expect(r.never()).toBe(r);
    });
  });
  describe('Result.try()', () => {
    test('should return just result of given function wrapped in ok', () => {
      expect(Result.try(() => 100).unwrap()).toBe(100);
    });
    test('should return err if given function thrown', () => {
      const o = {};
      expect(
        Result.try(() => {
          throw o;
        }).unwrapErr(),
      ).toBe(o);
    });
  });
});
