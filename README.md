# async-result

(A)synchronous Result<T, E> error handling classes inspired by Rust.

## Install

```
npm install --save @reismannnr2/async-result
```

## Example

```typescript
import { AsyncResult, ok, err } from '@reismannnr2/async-result';
const result =
  AsyncResult
    .begin()
    .andThenAsync(async () => {
      try {
        // database access
        return ok(await accessToDb())
      } catch (e) {
        return err({ type: 'database-error', ex: e })
      }
    })
    .andThenAsync(async (value) => {
      try {
        // fetching data from url
        return ok(await fetch(`http://example.com/${value}`))
      } catch (e) {
        return err({ type: 'network-error', e: e });
      }   
    })
    .map((resp) => {
      return resp.foobar;
    }).toPromise();

result.match({
  ok: (value) => { console.log(value) },
  err: (error) => {
    if (error.type === 'database-error') {
      console.error(`Database Error: ${error.e.message}`);
    }
    if (error.type === 'network-error') {
      console.error(`Network Error: ${error.e.message}`);
    }
  }
});
```

## Why this? We can use just Promise since it has error-handling functionality.

Promise does not keep error type, neither enforce us to handle error.
